import { EntityManager, In } from 'typeorm';
import { DatasetField } from '../../entities/dataset-field.entity';
import { DatasetMetric } from '../../entities/dataset-metric.entity';
import { DatasetJoin } from '../../entities/dataset-join.entity';
import { DatasetTable } from '../../entities/dataset-table.entity';
import { Dataset } from '../../entities/dataset.entity';
import {
  AddField,
  UpdateField,
  AddMetric,
  UpdateMetric,
  AddJoin,
  UpdateJoin,
  AddTable,
  UpdateTable,
} from '../../dto/update-dataset.req';
import { MetricType, PeriodCalculationMode } from '../../dataset.types';
import { DatasourceColumn } from '@/module/datasource/entities/datasource-column.entity';
import { ExceptionFactory } from '@/common/exceptions';

/**
 * 解析表达式中的 #F 和 #M 引用
 * #F10,20,30 表示字段ID列表
 * #M100,200 表示指标ID列表
 * 返回需要验证的字段ID列表和指标ID列表
 */
function parseExpressionIds(expression: string): {
  fieldIds: number[];
  metricIds: number[];
} {
  const fieldIds: number[] = [];
  const metricIds: number[] = [];

  // 匹配字段: #F10,20,30 或 #F10
  const fieldPattern = /#F(\d+(?:,\d+)*)/g;
  let match;
  while ((match = fieldPattern.exec(expression)) !== null) {
    const ids = match[1]
      .split(',')
      .map((id) => parseInt(id, 10))
      .filter((id) => !Number.isNaN(id));
    fieldIds.push(...ids);
  }

  // 匹配指标: #M100,200 或 #M100
  const metricPattern = /#M(\d+(?:,\d+)*)/g;
  while ((match = metricPattern.exec(expression)) !== null) {
    const ids = match[1]
      .split(',')
      .map((id) => parseInt(id, 10))
      .filter((id) => !Number.isNaN(id));
    metricIds.push(...ids);
  }

  return { fieldIds, metricIds };
}

/**
 * Legacy period-comparison metrics may still carry expression metadata, but
 * V2.1 query execution should prefer tempMetrics plus DatasetMetric.timeFieldId.
 * Fields such as baseMetricId / periodType / calculationMode remain
 * auxiliary defaults for query-time construction.
 */
type MetricLike = Partial<AddMetric> &
  Partial<UpdateMetric> & {
    id?: number;
    metricType?: MetricType;
    expression?: string;
  };

type ExpressionReferences = ReturnType<typeof parseExpressionIds>;

const describeMetric = (
  metric: MetricLike,
): string => {
  if (metric.name) {
    return `"${metric.name}"`;
  }
  if (metric.alias) {
    return `"${metric.alias}"`;
  }
  if (metric.id) {
    return `metric #${metric.id}`;
  }
  return 'new period-comparison metric';
};

const isExpressionDrivenPopMetric = (
  metric: MetricLike,
): boolean =>
  metric.metricType === MetricType.PERIOD_OVER_PERIOD && Boolean(metric.expression);

const validateExpressionDrivenPopMetric = (
  metric: MetricLike,
  expressionRefs: ExpressionReferences | null,
) => {
  if (
    !expressionRefs ||
    expressionRefs.fieldIds.length === 0 ||
    expressionRefs.metricIds.length === 0
  ) {
    ExceptionFactory.badRequest(
      `${describeMetric(metric)} must reference both #M and #F when using legacy expression-based PoP metadata.`,
    );
  }

  if (metric.calculationMode === PeriodCalculationMode.BOTH) {
    ExceptionFactory.badRequest(
      `Calculation mode "both" is not supported for expression-driven PoP metrics like ${describeMetric(
        metric,
      )}; please pick "percentage" or "absolute" instead.`,
    );
  }
};

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
export const metricManager: IEntityManager<AddMetric, UpdateMetric> = {
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

  async add(
    manager: EntityManager,
    dataSetId: number,
    metrics?: Partial<AddMetric>[],
  ) {
    if (metrics && metrics.length > 0) {
      const warnings: string[] = [];
      const validColIds: number[] = [];
      const validMetricIds: number[] = [];
      const validFieldIds: number[] = [];
      const metricExpressionRefs = new Map<Partial<AddMetric>, ExpressionReferences | null>();

      console.log('指标参数:', metrics);

      // 第一步：验证传入指标的参数
      for (const metric of metrics) {
        if (!metric) {
          warnings.push('指标参数错误，缺少必要信息');
          continue;
        }

        let expressionRefs: ExpressionReferences | null = null;

        // 收集需要验证的数据源列ID
        if (metric.dataSourceColumnId) {
          validColIds.push(metric.dataSourceColumnId);
        }
        if (metric.timeDataSourceColumnId) {
          validColIds.push(metric.timeDataSourceColumnId);
        }
        if (metric.timeFieldId) {
          validFieldIds.push(metric.timeFieldId);
        }

        // 收集需要验证的指标ID
        if (metric.sourceMetricId) {
          validMetricIds.push(metric.sourceMetricId);
        }
        if (metric.leftMetricId) {
          validMetricIds.push(metric.leftMetricId);
        }
        if (metric.rightMetricOperand) {
          validMetricIds.push(metric.rightMetricOperand);
        }
        if (metric.baseMetricId) {
          validMetricIds.push(metric.baseMetricId);
        }

        // 解析 expression 中的 #F 和 #M 引用
        // #F 引用的字段ID 记录到 validFieldIds，用于验证 DatasetField
        if (metric.expression) {
          expressionRefs = parseExpressionIds(metric.expression);
          validFieldIds.push(...expressionRefs.fieldIds);
          validMetricIds.push(...expressionRefs.metricIds);
          console.log('expression 中引用的字段ID:', expressionRefs.fieldIds);
          console.log('expression 中引用的指标ID:', expressionRefs.metricIds);
        }

        if (isExpressionDrivenPopMetric(metric)) {
          validateExpressionDrivenPopMetric(metric, expressionRefs);
        }

        metricExpressionRefs.set(metric, expressionRefs);
      }

      if (
        validColIds.length === 0 &&
        validMetricIds.length === 0 &&
        validFieldIds.length === 0
      ) {
        if (warnings.length > 0) {
          console.warn('添加指标警告:', warnings);
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
      let columnMap = new Map<number, DatasourceColumn>();
      if (validColIds.length > 0) {
        const columns = await manager.find(DatasourceColumn, {
          where: {
            id: In(validColIds),
            tableId: In(datasourceTableIds),
          },
        });

        columnMap = new Map<number, DatasourceColumn>();
        for (const column of columns) {
          columnMap.set(column.id, column);
        }
      }

      // 第三步（续）：查询 DatasetField（用于 expression 中的 #F 引用）
      let fieldMap = new Map<number, DatasetField>();
      if (validFieldIds.length > 0) {
        const fields = await manager.find(DatasetField, {
          where: {
            id: In(validFieldIds),
            dataSetId,
          },
        });
        fieldMap = new Map<number, DatasetField>(fields.map((f) => [f.id, f]));
      }

      // 第四步：查询相关指标
      let metricMap = new Map<number, DatasetMetric>();
      if (validMetricIds.length > 0) {
        const existingMetrics = await manager.find(DatasetMetric, {
          where: {
            id: In(validMetricIds),
            dataSetId,
          },
        });

        // 将 existingMetrics 转成 Map，方便快速查找
        metricMap = new Map<number, DatasetMetric>();
        for (const existingMetric of existingMetrics) {
          metricMap.set(existingMetric.id, existingMetric);
        }
      }

      // 第五步：处理每个指标，验证并保存
      for (const metric of metrics) {
        if (!metric) {
          continue; // 第一步已经记录过警告
        }

        // 验证数据源列
        if (
          metric.dataSourceColumnId &&
          !columnMap.has(metric.dataSourceColumnId)
        ) {
          warnings.push(
            `指标使用的字段 ${metric.dataSourceColumnId} 不存在或未添加包含该字段的表`,
          );
        }

        if (
          metric.timeDataSourceColumnId &&
          !columnMap.has(metric.timeDataSourceColumnId)
        ) {
          warnings.push(
            `指标使用的时间字段 ${metric.timeDataSourceColumnId} 不存在或未添加包含该字段的表`,
          );
        }

        // 验证相关指标
        if (metric.sourceMetricId && !metricMap.has(metric.sourceMetricId)) {
          warnings.push(
            `指标使用的源指标 ${metric.sourceMetricId} 不存在或不属于当前数据集`,
          );
        }

        if (metric.leftMetricId && !metricMap.has(metric.leftMetricId)) {
          warnings.push(
            `指标使用的左操作数指标 ${metric.leftMetricId} 不存在或不属于当前数据集`,
          );
        }

        if (
          metric.rightMetricOperand &&
          !metricMap.has(metric.rightMetricOperand)
        ) {
          warnings.push(
            `指标使用的右操作数指标 ${metric.rightMetricOperand} 不存在或不属于当前数据集`,
          );
        }

        if (metric.baseMetricId && !metricMap.has(metric.baseMetricId)) {
          warnings.push(
            `指标使用的基础指标 ${metric.baseMetricId} 不存在或不属于当前数据集`,
          );
        }

        const expressionRefs = metricExpressionRefs.get(metric) ?? null;

        // 验证 expression 中引用的 DatasetField（#F 引用）
        if (expressionRefs) {
          for (const fieldId of expressionRefs.fieldIds) {
            if (!fieldMap.has(fieldId)) {
              warnings.push(
                `expression 中引用的字段 ${fieldId} 不存在或不属于当前数据集`,
              );
            }
          }
        }

        if (metric.timeFieldId && !fieldMap.has(metric.timeFieldId)) {
          warnings.push(
            `指标默认业务时间字段 ${metric.timeFieldId} 不存在或不属于当前数据集`,
          );
        }

        // 创建 DatasetMetric
        const newMetric = manager.create(DatasetMetric, {
          ...metric,
          dataSetId,
        });

        await manager.save(newMetric);
      }

      if (warnings.length > 0) {
        console.warn('添加指标警告:', warnings);
      }
    }
  },

  async update(manager: EntityManager, metrics?: Partial<UpdateMetric>[]) {
    if (metrics && metrics.length > 0) {
      for (const metric of metrics) {
        if (!metric) {
          continue;
        }

        let expressionRefs: ExpressionReferences | null = null;
        if (metric.expression) {
          expressionRefs = parseExpressionIds(metric.expression);
        }

        if (isExpressionDrivenPopMetric(metric)) {
          validateExpressionDrivenPopMetric(metric, expressionRefs);
        }

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
export const joinManager: IEntityManager<AddJoin, UpdateJoin> = {
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

  async add(
    manager: EntityManager,
    dataSetId: number,
    joins?: Partial<AddJoin>[],
  ) {
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

  async update(manager: EntityManager, joins?: Partial<UpdateJoin>[]) {
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
export const tableManager: IEntityManager<AddTable, UpdateTable> = {
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

  async add(
    manager: EntityManager,
    dataSetId: number,
    tables?: Partial<AddTable>[],
  ) {
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

  async update(manager: EntityManager, tables?: Partial<UpdateTable>[]) {
    if (tables && tables.length > 0) {
      for (const table of tables) {
        if (table.id) {
          await manager.update(DatasetTable, table.id, table);
        }
      }
    }
  },
};
