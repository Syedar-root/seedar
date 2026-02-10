import { Inject, Injectable } from '@nestjs/common';
import { CreateDatasetRequest } from '../dto/create-dataset.request';
import { UpdateDatasetDto } from '../dto/update-dataset.dto';
import { Dataset } from '../entities/dataset.entity';
import { DatasetTable } from '../entities/dataset-table.entity';
import { DatasetJoin } from '../entities/dataset-join.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatasourceService } from '@/module/datasource/service/datasource.service';
import { DatasourceTableService } from '@/module/datasource/service/datasource-table.service';
import { DatasetStatus, DatasetType, FieldType, JoinType } from '../dataset.types';
import { DatasourceForeignKeyService } from '@/module/datasource/service/datasource-foreign-key.service';
import { ExceptionFactory } from '@/common/exceptions';
import { DatasetField } from '../entities/dataset-field.entity';
import { DatasourceColumnService } from '@/module/datasource/service/datasource-column.service';

@Injectable()
export class DatasetService {
  @InjectRepository(Dataset)
  private readonly datasetRepository!: Repository<Dataset>;

  @InjectRepository(DatasetTable)
  private readonly datasetTableRepository!: Repository<DatasetTable>;

  @InjectRepository(DatasetJoin)
  private readonly datasetJoinRepository!: Repository<DatasetJoin>;

  @InjectRepository(DatasetField)
  private readonly datasetFieldRepository!: Repository<DatasetField>;

  @Inject(DatasourceService)
  private readonly datasourceService!: DatasourceService;

  @Inject(DatasourceForeignKeyService)
  private readonly datasourceForeignKeyService!: DatasourceForeignKeyService;


  @Inject(DatasourceTableService)
  private readonly datasourceTableService!: DatasourceTableService;

  @Inject(DatasourceColumnService)
  private readonly datasourceColumnService!: DatasourceColumnService;

  async create(request: CreateDatasetRequest) {
    // 验证数据源是否存在
    const datasource = await this.datasourceService.findOne(
      request.datasourceId,
    );

    if (!datasource) {
      throw new Error('数据源不存在');
    }

    // 获取选中的数据表
    const selectedTables = await Promise.all(
      request.datasourceTableIds.map((id) =>
        this.datasourceTableService.findOne(id),
      ),
    );

    // 检查所有表是否都存在
    const missingTables = selectedTables.filter((table) => !table);
    if (missingTables.length > 0) {
      throw new Error('部分数据表不存在');
    }

    // 获取所有选中的表的 ID 列表
    const selectedTableIds = selectedTables.map((table) => table!.id);

    // 使用事务确保所有操作原子性
    const savedDataset = await this.datasetRepository.manager.transaction(
      async (manager) => {
        // 创建数据集实体
        const dataset = manager.create(Dataset, {
          name: request.name,
          description: request.description,
          datasource: { id: datasource.id } as Dataset['datasource'],
          status: DatasetStatus.ACTIVE,
          type: DatasetType.SEMANTIC,
        });

        // 保存数据集
        const saved = await manager.save(dataset);

        // 验证数据集字段
        if (!request.fields || request.fields.length === 0) {
          ExceptionFactory.badRequest('数据集字段不能为空，必须包含至少一个字段');
        }

        // 获取每个表的主键列信息
        const tablePrimaryKeys = await Promise.all(
          selectedTableIds.map(async (tableId) => {
            const columns = await this.datasourceColumnService.findByTableId(
              tableId,
            );
            return {
              tableId,
              primaryKeyColumns: columns.filter((col) => col.isPrimaryKey),
            };
          }),
        );

        // 验证每个表都有主键字段在数据集中
        for (const tableInfo of tablePrimaryKeys) {
          // 获取该表在请求字段中的字段
          const tableFieldsInRequest = request.fields.filter(
            (f) => f.tableId === tableInfo.tableId,
          );

          // 检查该表是否有主键
          if (tableInfo.primaryKeyColumns.length > 0) {
            // 如果有主键列，检查是否至少有一个主键列在数据集中
            const hasPrimaryKeyInDataset = tableInfo.primaryKeyColumns.some(
              (pk) =>
                tableFieldsInRequest.some(
                  (f) => f.dataSourceColumnId === pk.id,
                ),
            );

            if (!hasPrimaryKeyInDataset) {
              const table = selectedTables.find(
                (t) => t!.id === tableInfo.tableId,
              );
              ExceptionFactory.badRequest(
                `表 "${table?.tableName}" 的主键字段必须包含在数据集中`,
              );
            }
          }
        }

        // 先创建数据集字段（这样可以获取到它们的 ID）
        const datasetFields = await Promise.all(
          request.fields.map(async (field) => {
            const datasourceColumn =
              await this.datasourceColumnService.findOne(field.dataSourceColumnId);
            return manager.create(DatasetField, {
              datasetId: saved.id,
              dataSourceColumnId: field.dataSourceColumnId,
              tableId: field.tableId,
              description: field.description,
              businessName: field.businessName,
              name: field.name,
              type: datasourceColumn?.normalizedType || FieldType.STRING,
              // 如果请求中指定了 isPrimaryKey，则使用请求的值；否则继承数据源列的主键状态
              isPrimaryKey: field.isPrimaryKey ?? datasourceColumn?.isPrimaryKey ?? false,
            });
          }),
        );
        await manager.save(datasetFields);

        // 创建字段 ID 映射（dataSourceColumnId -> datasetFieldId）
        const columnIdToFieldId = new Map(
          datasetFields.map((f) => [f.dataSourceColumnId, f.id]),
        );

        // 创建数据集表关联（设置主键字段 ID）
        const datasetTables = selectedTables.map((table) => {
          // 查找该表的主键列
          const primaryKeyInfo = tablePrimaryKeys.find(
            (pk) => pk.tableId === table!.id,
          );
          // 获取主键列的 datasetFieldId
          const primaryColumn = primaryKeyInfo?.primaryKeyColumns[0];
          const primaryFieldId = primaryColumn
            ? columnIdToFieldId.get(primaryColumn.id)
            : null;

          return manager.create(DatasetTable, {
            datasetId: saved.id,
            tableId: table!.id,
            datasetName: saved.name,
            tableName: table!.tableName,
            primaryFieldId: primaryFieldId ?? undefined,
          });
        });
        await manager.save(datasetTables);

        // 创建数据集join关系
        if (request.joins && request.joins.length > 0) {
          const datasetJoins = request.joins.map((join) =>
            manager.create(DatasetJoin, {
              dataset: { id: saved.id } as Dataset,
              leftTableId: selectedTables[join.leftTableId]!.id,
              leftField: join.leftColumnId.toString(),
              rightTableId: selectedTables[join.rightTableId]!.id,
              rightField: join.rightColumnId.toString(),
              joinType: join.joinType || JoinType.INNER,
            }),
          );
          await manager.save(datasetJoins);
        } else {
          // 默认使用外键关系
          const foreignKeys =
            await this.datasourceForeignKeyService.findByDataSourceId(
              datasource.id,
            );
          if (foreignKeys.length > 0) {
            const datasetJoins = foreignKeys.map((foreignKey) => {
              const leftTable = selectedTables.find(
                (t) => t!.tableName === foreignKey.sourceTableName,
              );
              const rightTable = selectedTables.find(
                (t) => t!.tableName === foreignKey.targetTableName,
              );
              return manager.create(DatasetJoin, {
                dataset: { id: saved.id } as Dataset,
                leftTableId: leftTable?.id ?? 0,
                leftField: foreignKey.sourceColumnName,
                rightTableId: rightTable?.id ?? 0,
                rightField: foreignKey.targetColumnName,
                joinType: JoinType.INNER,
              });
            });
            await manager.save(datasetJoins);
          } else {
            ExceptionFactory.badRequest(
              '数据源没有外键关系，需要配置表之间的关联关系',
            );
          }
        }

        return saved;
      },
    );

    // 返回创建的数据集
    return savedDataset;
  }

  findAll() {
    return `This action returns all dataset`;
  }

  findOne(id: number) {
    return `This action returns a #${id} dataset`;
  }

  update(id: number, updateDatasetDto: UpdateDatasetDto) {
    return `This action updates a #${id} dataset`;
  }

  remove(id: number) {
    return `This action removes a #${id} dataset`;
  }
}
