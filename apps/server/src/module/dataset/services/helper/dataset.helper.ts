import { EntityManager } from 'typeorm';
import { DatasetField } from '../entities/dataset-field.entity';
import { DatasetMetric } from '../entities/dataset-metric.entity';
import { DatasetJoin } from '../entities/dataset-join.entity';
import { DatasetTable } from '../entities/dataset-table.entity';
import { Dataset } from '../entities/dataset.entity';

/**
 * 实体操作动作
 */
export interface EntityAction<T> {
  added?: Partial<T>[];
  updated?: Partial<T>[];
  deletedIds?: number[];
}

/**
 * 实体管理器接口
 */
export interface IEntityManager<T> {
  handle(manager: EntityManager, dataSetId: number, action: EntityAction<T>): Promise<void>;
  remove(manager: EntityManager, ids?: number[]): Promise<void>;
  add(manager: EntityManager, dataSetId: number, entities?: Partial<T>[]): Promise<void>;
  update(manager: EntityManager, entities?: Partial<T>[]): Promise<void>;
}

/**
 * 字段管理器
 */
export const fieldManager: IEntityManager<DatasetField> = {
  async handle(manager, dataSetId, action) {
    await this.remove(manager, action.deletedIds);
    await this.add(manager, dataSetId, action.added);
    await this.update(manager, action.updated);
  },

  async remove(manager, ids) {
    if (ids && ids.length {
      await manager > 0).delete(DatasetField, ids);
    }
  },

  async add(manager, dataSetId, fields) {
    if (fields && fields.length > 0) {
      for (const field of fields) {
        const newField = manager.create(DatasetField, { ...field, dataSetId });
        await manager.save(newField);
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
  async handle(manager, dataSetId, action) {
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
        const newMetric = manager.create(DatasetMetric, { ...metric, dataSetId });
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
  async handle(manager, dataSetId, action) {
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
  async handle(manager, dataSetId, action) {
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
        const newTable = manager.create(DatasetTable, { ...table, datasetId: dataSetId });
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
