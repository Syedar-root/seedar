import { Inject, Injectable } from '@nestjs/common';
import { CreateDatasetRequest } from '../dto/create-dataset.request';
import { UpdateDatasetRequest } from '../dto/update-dataset.req';
import { Dataset } from '../entities/dataset.entity';
import { DatasetTable } from '../entities/dataset-table.entity';
import { DatasetJoin } from '../entities/dataset-join.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DatasourceService } from '@/module/datasource/service/datasource.service';
import { DatasourceTableService } from '@/module/datasource/service/datasource-table.service';
import {
  DatasetStatus,
  DatasetType,
  FieldType,
  JoinType,
  DatasetResponse,
  DatasetMetricResponse,
} from '../dataset.types';
import { DatasourceForeignKeyService } from '@/module/datasource/service/datasource-foreign-key.service';
import { ExceptionFactory } from '@/common/exceptions';
import { DatasetField } from '../entities/dataset-field.entity';
import { DatasetMetric } from '../entities/dataset-metric.entity';
import { DatasourceColumnService } from '@/module/datasource/service/datasource-column.service';
import {
  fieldManager,
  metricManager,
  joinManager,
  tableManager,
} from './helper/dataset.helper';

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

  @InjectRepository(DatasetMetric)
  private readonly datasetMetricRepository!: Repository<DatasetMetric>;

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
          ExceptionFactory.badRequest(
            '数据集字段不能为空，必须包含至少一个字段',
          );
        }

        // 获取每个表的主键列信息
        const tablePrimaryKeys = await Promise.all(
          selectedTableIds.map(async (tableId) => {
            const columns =
              await this.datasourceColumnService.findByTableId(tableId);
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

        // 1. 先创建 DatasetTables（不设置 primaryFieldId）
        const datasetTables = selectedTables.map((table) => {
          return manager.create(DatasetTable, {
            datasetId: saved.id,
            datasourceTableId: table!.id,
            datasetName: saved.name,
            tableName: table!.tableName,
          });
        });
        const savedDatasetTables = await manager.save(datasetTables);

        // 创建 tableId -> datasetTableId 映射
        const tableIdToDatasetTableId = new Map(
          savedDatasetTables.map((t, index) => [
            selectedTables[index]!.id,
            t.id,
          ]),
        );

        // 如果传入了主表 ID，更新数据集的主表
        if (request.mainTableId) {
          const mainDatasetTableId = tableIdToDatasetTableId.get(
            request.mainTableId,
          );
          if (mainDatasetTableId) {
            await manager.update(Dataset, saved.id, {
              mainTableId: mainDatasetTableId,
            });
          }
        }

        // 2. 创建 DatasetFields
        const datasetFields = await Promise.all(
          request.fields.map(async (field) => {
            const datasourceColumn = await this.datasourceColumnService.findOne(
              field.dataSourceColumnId,
            );
            return manager.create(DatasetField, {
              dataSetId: saved.id,
              dataSourceColumnId: field.dataSourceColumnId,
              tableId: tableIdToDatasetTableId.get(field.tableId)!, // 使用新的 tableId
              description: field.description,
              businessName: field.businessName,
              name: field.name,
              type: datasourceColumn?.normalizedType || FieldType.STRING,
              isPrimaryKey:
                field.isPrimaryKey ?? datasourceColumn?.isPrimaryKey ?? false,
            });
          }),
        );
        await manager.save(datasetFields);

        // 3. 创建字段 ID 映射（dataSourceColumnId -> datasetFieldId）
        const columnIdToFieldId = new Map(
          datasetFields.map((f) => [f.dataSourceColumnId, f.id]),
        );

        // 4. 更新 DatasetTables 的 primaryFieldId
        for (let i = 0; i < savedDatasetTables.length; i++) {
          const originalTable = selectedTables[i];
          const savedTable = savedDatasetTables[i];

          // 查找该表的主键列
          const primaryKeyInfo = tablePrimaryKeys.find(
            (pk) => pk.tableId === originalTable!.id,
          );

          // 获取主键列的 datasetFieldId
          const primaryColumn = primaryKeyInfo?.primaryKeyColumns[0];
          const primaryFieldId = primaryColumn
            ? columnIdToFieldId.get(primaryColumn.id)
            : null;

          if (primaryFieldId) {
            await manager.update(DatasetTable, savedTable.id, {
              primaryFieldId,
            });
          }
        }

        // 创建数据集join关系
        if (request.joins && request.joins.length > 0) {
          const datasetJoins = request.joins.map((join) => {
            // 根据 tableId 找到对应的 datasetTableId
            // const leftDatasetTableId = tableIdToDatasetTableId.get(
            //   join.leftTableId,
            // );
            // const rightDatasetTableId = tableIdToDatasetTableId.get(
            //   join.rightTableId,
            // );

            return manager.create(DatasetJoin, {
              dataset: { id: saved.id } as Dataset,
              leftTableId: join.leftTableId,
              leftField: join.leftColumnId.toString(),
              rightTableId: join.rightTableId,
              rightField: join.rightColumnId.toString(),
              joinType: join.joinType || JoinType.INNER,
            });
          });
          await manager.save(datasetJoins);
        } else if (selectedTables.length > 1) {
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

  /**
   * 查询所有数据集（带完整信息）
   * 优化：使用单次查询获取所有数据，避免 N+1 问题
   */
  async findAllWithDetails() {
    // 1. 查询所有数据集及关联的数据源和主表
    const datasets = await this.datasetRepository.find({
      relations: ['datasource', 'mainTable'],
    });

    if (datasets.length === 0) {
      return [];
    }

    const datasetIds = datasets.map((d) => d.id);

    // 2. 批量查询所有关联的表
    const allTables = await this.datasetTableRepository.find({
      where: { datasetId: In(datasetIds) },
    });

    // 3. 批量查询所有字段
    const allFields = await this.datasetFieldRepository.find({
      where: { dataSetId: In(datasetIds) },
      relations: ['table'],
      order: { id: 'ASC' },
    });

    // 4. 批量查询所有指标
    const allMetrics = await this.datasetMetricRepository.find({
      where: { dataSetId: In(datasetIds) },
      relations: [
        'dataSourceColumn',
        'leftOperandField',
        'rightOperandField',
        'sourceMetric',
        'leftMetric',
        'rightMetricOperandField',
        'baseMetric',
        'timeDataSourceColumn',
      ],
      order: { id: 'ASC' },
    });

    // 5. 批量查询所有join信息
    const allJoins = await this.datasetJoinRepository.find({
      where: { datasetId: In(datasetIds) },
      order: { id: 'ASC' },
    });

    // 6. 按 datasetId 分组
    const tablesMap = this.groupByDatasetId(allTables);
    const fieldsMap = this.groupByDatasetId(allFields);
    const metricsMap = this.groupByDatasetId(allMetrics);
    const joinsMap = this.groupByDatasetId(allJoins);

    // 7. 转换格式
    return datasets.map((dataset) =>
      this.transformDataset(
        dataset,
        tablesMap.get(dataset.id) || [],
        fieldsMap.get(dataset.id) || [],
        metricsMap.get(dataset.id) || [],
        joinsMap.get(dataset.id) || [],
      ),
    );
  }

  /**
   * 根据ID查询单个数据集（带完整信息）
   */
  async findOne(id: number): Promise<DatasetResponse | null> {
    // 查询数据集基本信息及关联的数据源和主表
    const dataset = await this.datasetRepository.findOne({
      where: { id },
      relations: ['datasource', 'mainTable'],
    });

    if (!dataset) {
      return null;
    }

    // 查询关联的表
    const tables = await this.datasetTableRepository.find({
      where: { datasetId: id },
    });

    // 查询字段信息
    const fields = await this.datasetFieldRepository.find({
      where: { dataSetId: id },
      relations: ['table'],
      order: { id: 'ASC' },
    });

    // 查询指标信息
    const metrics = await this.datasetMetricRepository.find({
      where: { dataSetId: id },
      relations: [
        'dataSourceColumn',
        'leftOperandField',
        'rightOperandField',
        'sourceMetric',
        'leftMetric',
        'rightMetricOperandField',
        'baseMetric',
        'timeDataSourceColumn',
      ],
      order: { id: 'ASC' },
    });

    // 查询join信息
    const joins = await this.datasetJoinRepository.find({
      where: { dataset: { id } },
      order: { id: 'ASC' },
    });

    // 使用 transformDataset 转换格式
    return this.transformDataset(dataset, tables, fields, metrics, joins);
  }

  /**
   * 按 datasetId 分组
   */
  private groupByDatasetId<
    T extends {
      dataSetId?: number;
      datasetId?: number;
      dataset?: { id: number };
    },
  >(items: T[]): Map<number, T[]> {
    const map = new Map<number, T[]>();
    for (const item of items) {
      const key = item.dataSetId || item.datasetId || item.dataset?.id || 0;
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }

  /**
   * 转换数据集实体为返回格式
   */
  private transformDataset(
    dataset: Dataset,
    tables: DatasetTable[],
    fields: DatasetField[],
    metrics: DatasetMetric[],
    joins: DatasetJoin[],
  ): DatasetResponse {
    return {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description,
      type: dataset.type,
      status: dataset.status,
      mainTableId: dataset.mainTableId,
      datasource: dataset.datasource
        ? {
            id: dataset.datasource.id,
            name: dataset.datasource.name,
            type: dataset.datasource.type,
          }
        : null,
      mainTable: dataset.mainTable
        ? {
            id: dataset.mainTable.id,
            tableName: dataset.mainTable.tableName,
            datasetName: dataset.mainTable.datasetName,
          }
        : null,
      tables: tables.map((table) => ({
        id: table.id,
        datasourceTableId: table.datasourceTableId,
        tableName: table.tableName,
        datasetName: table.datasetName,
        primaryFieldId: table.primaryFieldId,
      })),
      fields: fields.map((field) => ({
        id: field.id,
        name: field.name,
        alias: field.alias,
        type: field.type,
        description: field.description,
        businessName: field.businessName,
        isPrimaryKey: field.isPrimaryKey,
        tableId: field.tableId,
        tableName: field.table?.tableName,
        datasourceColumnId: field.dataSourceColumnId,
      })),
      metrics: metrics.map((metric) => this.transformMetric(metric)),
      joins: joins.map((join) => ({
        id: join.id,
        joinType: join.joinType,
        leftTableId: join.leftTableId,
        leftField: join.leftField,
        rightTableId: join.rightTableId,
        rightField: join.rightField,
        operator: join.operator,
      })),
    };
  }

  /**
   * 转换指标实体为返回格式
   */
  private transformMetric(metric: DatasetMetric): DatasetMetricResponse {
    return {
      id: metric.id,
      name: metric.name,
      alias: metric.alias,
      description: metric.description,
      businessName: metric.businessName,
      metricType: metric.metricType,
      dataSourceColumnId: metric.dataSourceColumnId,
      dataSourceColumnName: metric.dataSourceColumn?.columnName,
      aggregateFunction: metric.aggregateFunction,
      distinct: metric.distinct,
      aggregateCondition: metric.aggregateCondition,
      // 行级指标
      leftOperand: metric.leftOperand,
      leftOperandFieldName: metric.leftOperandField?.columnName,
      rowOperator: metric.rowOperator,
      rightOperand: metric.rightOperand,
      rightOperandFieldName: metric.rightOperandField?.columnName,
      // 后聚合指标
      sourceMetricId: metric.sourceMetricId,
      sourceMetricName: metric.sourceMetric?.name,
      // 算术运算指标
      leftMetricId: metric.leftMetricId,
      leftMetricName: metric.leftMetric?.name,
      arithmeticOperator: metric.arithmeticOperator,
      rightMetricOperand: metric.rightMetricOperand,
      rightMetricOperandFieldName: metric.rightMetricOperandField?.name,
      // 同环比指标
      baseMetricId: metric.baseMetricId,
      baseMetricName: metric.baseMetric?.name,
      timeDataSourceColumnId: metric.timeDataSourceColumnId,
      timeDataSourceColumnName: metric.timeDataSourceColumn?.columnName,
      periodType: metric.periodType,
      calculationMode: metric.calculationMode,
      // 表达式指标
      expression: metric.expression,
    };
  }

  async update(updateDatasetRequest: UpdateDatasetRequest) {
    const { dataSetId, name, description, fields, metrics, joins, tables } =
      updateDatasetRequest;

    // 1. 验证数据集是否存在
    const dataset = await this.datasetRepository.findOne({
      where: { id: dataSetId },
    });

    if (!dataset) {
      throw new Error('数据集不存在');
    }

    // 2. 更新基本属性（name, description）
    const updateData: Partial<Dataset> = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    if (Object.keys(updateData).length > 0) {
      await this.datasetRepository.update(dataSetId, updateData);
    }

    // 3. 使用事务处理所有更新操作
    await this.datasetRepository.manager.transaction(async (manager) => {
      // 调用各个管理器处理对应的实体操作
      if (fields) {
        await fieldManager.handle(manager, dataSetId, fields);
      }
      if (metrics) {
        await metricManager.handle(manager, dataSetId, metrics);
      }
      if (joins) {
        await joinManager.handle(manager, dataSetId, joins);
      }
      if (tables) {
        await tableManager.handle(manager, dataSetId, tables);
      }
    });

    // 4. 返回更新后的数据集完整信息
    return this.findOne(dataSetId);
  }

  remove(id: number) {
    return `This action removes a #${id} dataset`;
  }
}
