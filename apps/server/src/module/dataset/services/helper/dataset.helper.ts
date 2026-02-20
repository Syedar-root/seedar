import { EntityManager, In } from 'typeorm';
import { DatasetField } from '../../entities/dataset-field.entity';
import { DatasetMetric } from '../../entities/dataset-metric.entity';
import { DatasetJoin } from '../../entities/dataset-join.entity';
import { DatasetTable } from '../../entities/dataset-table.entity';
import { Dataset } from '../../entities/dataset.entity';
import { AddField, UpdateField } from '../../dto/update-dataset.req';
import { DatasourceColumn } from '@/module/datasource/entities/datasource-column.entity';
import { ExceptionFactory } from '@/common/exceptions';

/**
 * 实体操作动作
 */
export interface EntityAction<T, S = T> {
  added?: Partial<T>[];
  updated?: Partial<S>[];
  deletedIds?: number[];
}

/**
 * 实体管理器接口
 */
export interface IEntityManager<T, S = T> {
  handle: (
    manager: EntityManager,
    dataSetId: number,
    action: EntityAction<T, S>,
  ) => Promise<void>;
  remove: (manager: EntityManager, ids?: number[]) => Promise<void>;
  add: (
    manager: EntityManager,
    dataSetId: number,
    entities?: Partial<T>[],
  ) => Promise<void>;
  update: (manager: EntityManager, entities?: Partial<S>[]) => Promise<void>;
}

/**
 * 字段管理器
 */
export const fieldManager: IEntityManager<AddField, UpdateField> = {
  async handle(this: typeof fieldManager, manager, dataSetId, action) {
    await this.remove(manager, action.deletedIds);
    await this.add(manager, dataSetId, action.added);
    await this.update(manager, action.updated);
  },

  async remove(manager, ids) {
    if (ids && ids.length > 0) {
      await manager.delete(DatasetField, ids);
    }
  },

  async add(
    manager: EntityManager,
    dataSetId: number,
    fields?: Partial<AddField>[],
  ) {
    if (fields && fields.length > 0) {
      const warnings: string[] = [];
      const validColIds: number[] = [];

      // 第一步：验证传入字段的参数
      for (const field of fields) {
        if (!field || !field.dataSourceColumnId) {
          warnings.push('字段参数错误，缺少必要信息');
          continue;
        }
        validColIds.push(field.dataSourceColumnId);
      }

      if (validColIds.length === 0) {
        if (warnings.length > 0) {
          // TODO: 这里可以考虑如何返回警告信息
          console.warn('添加字段警告:', warnings);
        }
        return;
      }

      // 第二步：获取数据集信息
      const dataset = await manager.findOne(Dataset, {
        where: {
          id: dataSetId,
        },
        relations: ['datasetTables'],
      });

      if (!dataset) ExceptionFactory.notFound(`找不到数据集 ${dataSetId}`);
      const datasourceTableIds = dataset.datasetTables.map(
        (t) => t.datasourceTableId,
      );

      // 第三步：查询数据源列
      const columns = await manager.find(DatasourceColumn, {
        where: {
          id: In(validColIds),
          tableId: In(datasourceTableIds),
        },
      });

      // 第四步：将 columns 转成 Map，方便快速查找
      const columnMap = new Map<number, DatasourceColumn>();
      for (const column of columns) {
        columnMap.set(column.id, column);
      }

      // 第五步：处理每个字段，验证并保存
      for (const field of fields) {
        if (!field || !field.dataSourceColumnId) {
          continue; // 第一步已经记录过警告
        }

        const column = columnMap.get(field.dataSourceColumnId);
        if (!column) {
          warnings.push(
            `字段 ${field.dataSourceColumnId} 不存在或未添加包含该字段的表`,
          );
          continue;
        }

        // 找到对应的 datasetTableId（注意：这里需要根据 datasourceTableId 找到对应的 datasetTable）
        // 先找到 dataset.datasetTables 中对应的表
        const datasetTable = dataset.datasetTables.find(
          (t) => t.datasourceTableId === column.tableId,
        );
        if (!datasetTable) {
          warnings.push(`未添加包含字段 ${field.dataSourceColumnId} 的表`);
          continue;
        }

        // 创建 DatasetField
        const newField = manager.create(DatasetField, {
          dataSetId,
          dataSourceColumnId: field.dataSourceColumnId,
          tableId: datasetTable.id,
          table: datasetTable,
          name: column.columnName,
          type: column.normalizedType,
          businessName: field.businessName || column.columnName,
          isPrimaryKey: column.isPrimaryKey,
        });

        await manager.save(newField);
      }

      if (warnings.length > 0) {
        // TODO: 这里可以考虑如何返回警告信息
        console.warn('添加字段警告:', warnings);
      }
    }
  },

  async update(manager, fields) {
    if (fields && fields.length > 0) {
      for (const field of fields) {
        if (field.id) {
          await manager.update(DatasetField, field.id, field);
        }
      }
    }
  },
};

/**
 * 指标管理器
 */
export const metricManager: IEntityManager<DatasetMetric> = {
  async handle(this: typeof metricManager, manager, dataSetId, action) {
    await this.remove(manager, action.deletedIds);
    await this.add(manager, dataSetId, action.added);
    await this.update(manager, action.updated);
  },

  async remove(manager, ids) {
    if (ids && ids.length > 0) {
      await manager.delete(DatasetMetric, ids);
    }
  },

  async add(manager, dataSetId, metrics) {
    if (metrics && metrics.length > 0) {
      for (const metric of metrics) {
        const newMetric = manager.create(DatasetMetric, {
          ...metric,
          dataSetId,
        });
        await manager.save(newMetric);
      }
    }
  },

  async update(manager, metrics) {
    if (metrics && metrics.length > 0) {
      for (const metric of metrics) {
        if (metric.id) {
          await manager.update(DatasetMetric, metric.id, metric);
        }
      }
    }
  },
};

/**
 * Join 管理器
 */
export const joinManager: IEntityManager<DatasetJoin> = {
  async handle(this: typeof joinManager, manager, dataSetId, action) {
    await this.remove(manager, action.deletedIds);
    await this.add(manager, dataSetId, action.added);
    await this.update(manager, action.updated);
  },

  async remove(manager, ids) {
    if (ids && ids.length > 0) {
      await manager.delete(DatasetJoin, ids);
    }
  },

  async add(manager, dataSetId, joins) {
    if (joins && joins.length > 0) {
      for (const join of joins) {
        const newJoin = manager.create(DatasetJoin, {
          ...join,
          dataset: { id: dataSetId } as Dataset,
        });
        await manager.save(newJoin);
      }
    }
  },

  async update(manager, joins) {
    if (joins && joins.length > 0) {
      for (const join of joins) {
        if (join.id) {
          await manager.update(DatasetJoin, join.id, join);
        }
      }
    }
  },
};

/**
 * 表管理器
 */
export const tableManager: IEntityManager<DatasetTable> = {
  async handle(this: typeof tableManager, manager, dataSetId, action) {
    await this.remove(manager, action.deletedIds);
    await this.add(manager, dataSetId, action.added);
    await this.update(manager, action.updated);
  },

  async remove(manager, ids) {
    if (ids && ids.length > 0) {
      await manager.delete(DatasetTable, ids);
    }
  },

  async add(manager, dataSetId, tables) {
    if (tables && tables.length > 0) {
      for (const table of tables) {
        const newTable = manager.create(DatasetTable, {
          ...table,
          datasetId: dataSetId,
        });
        await manager.save(newTable);
      }
    }
  },

  async update(manager, tables) {
    if (tables && tables.length > 0) {
      for (const table of tables) {
        if (table.id) {
          await manager.update(DatasetTable, table.id, table);
        }
      }
    }
  },
};
