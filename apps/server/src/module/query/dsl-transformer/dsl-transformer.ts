/**
 * DSL转换器 - 将query模块的DSL转换为metric-engine的Query
 */
import {
  Table,
  Field,
  Query as MetricQuery,
  Dimension,
  Filter,
  AggregateMetric,
  AggregateFunction,
  Operator,
  Join,
  JoinType,
  JoinCondition,
  TimeFilter,
  TimeRange,
  RowLevelMetric,
  PostAggregateMetric,
  ArithmeticMetric,
  MetricExpression,
  QueryBuilder,
} from '@metric-engine/core';
import {
  DatasetResponse,
  DatasetTableResponse,
  DatasetFieldResponse,
  DatasetMetricResponse,
  DatasetJoinResponse,
  MetricType,
  MetricAggregateFunction,
} from '@/module/dataset/dataset.types';

/**
 * query模块的DSL结构（使用ID引用dataset模块中的实体）
 */
export interface QueryDSL {
  /** 数据集ID */
  datasetId: number;
  /** 主表ID */
  tableId: number;
  /** 维度 - 使用字段ID引用 */
  dimensions?: Array<number | { fieldId: number; alias?: string }>;
  /** 指标 - 使用指标ID引用 */
  metrics?: Array<{
    id: number;
    alias?: string;
  }>;
  /** 筛选条件 */
  filters?: Array<{
    fieldId: number;
    op: string;
    value?: any;
    raw?: boolean;
  }>;
  /** 连接 - 使用表ID引用 */
  joins?: Array<{
    id: number;
    type?: 'left' | 'inner' | 'right' | 'full';
  }>;
  /** 限制返回的记录数（可选） */
  limit?: number;
  /** 偏移量（用于分页，可选） */
  offset?: number;
}

/**
 * DSL转换器类
 */
export class DSLTransformer {
  /**
   * 将query DSL转换为metric-engine的Query
   * @param dsl query模块的DSL
   * @param datasetInfo 数据集信息，包含表、字段、指标等
   * @param tables 表定义数组
   * @returns metric-engine的Query对象
   */
  static transform(
    dsl: QueryDSL,
    datasetInfo: DatasetResponse,
    tables: Table[],
  ): MetricQuery {
    if (!dsl || !dsl.tableId) {
      console.log('DSL:', dsl);
      throw new Error('DSL必须包含tableId字段');
    }

    // 构建映射表
    const tableMap = new Map<number, DatasetTableResponse>();
    const fieldMap = new Map<number, DatasetFieldResponse>();
    // datasourceColumnId 到 field 的映射
    const fieldMapWithDCId = new Map<number, DatasetFieldResponse>();
    const metricMap = new Map<number, DatasetMetricResponse>();
    const joinMap = new Map<number, DatasetJoinResponse>();

    // 填充映射表
    (datasetInfo.tables || []).forEach((table: DatasetTableResponse) => {
      tableMap.set(table.id, table);
    });

    (datasetInfo.fields || []).forEach((field: DatasetFieldResponse) => {
      fieldMap.set(field.id, field);
      // 填充 datasourceColumnId 到 field 的映射
      if (field.datasourceColumnId) {
        fieldMapWithDCId.set(field.datasourceColumnId, field);
      }
    });

    (datasetInfo.metrics || []).forEach((metric: DatasetMetricResponse) => {
      metricMap.set(metric.id, metric);
    });

    (datasetInfo.joins || []).forEach((join: DatasetJoinResponse) => {
      joinMap.set(join.id, join);
    });

    // 查找主表
    const mainTableInfo = tableMap.get(dsl.tableId);
    if (!mainTableInfo) {
      throw new Error(`找不到主表: ${dsl.tableId}`);
    }

    const mainTable = tables.find((t) => t.name === mainTableInfo.tableName);
    if (!mainTable) {
      throw new Error(`找不到主表: ${mainTableInfo.tableName}`);
    }

    // 创建连接
    const joins: Join[] = [];

    if (dsl.joins && dsl.joins.length > 0) {
      for (const j of dsl.joins) {
        const joinInfo = joinMap.get(j.id);
        if (!joinInfo) {
          throw new Error(`找不到连接: ${j.id}`);
        }

        const rightTableInfo = tableMap.get(joinInfo.rightTableId);
        if (!rightTableInfo) {
          throw new Error(`找不到右表: ${joinInfo.rightTableId}`);
        }

        const rightTable = tables.find(
          (t) => t.name === rightTableInfo.tableName,
        );
        if (!rightTable) {
          throw new Error(`找不到JOIN表: ${rightTableInfo.tableName}`);
        }

        // 设置表别名
        // 停用表别名，因为metric-engine不支持
        // if (rightTableInfo.alias) {
        //   rightTable.alias = rightTableInfo.alias;
        // }

        // 创建连接条件
        const conditions = [
          new JoinCondition({
            leftField:
              fieldMapWithDCId.get(Number(joinInfo.leftField))?.name || '',
            rightField:
              fieldMapWithDCId.get(Number(joinInfo.rightField))?.name || '',
          }),
        ];

        // 添加连接
        joins.push(
          new Join({
            type: (j.type || joinInfo.joinType) as JoinType,
            leftTable: mainTable,
            rightTable,
            conditions,
          }),
        );
      }
    }

    // 解析字段引用
    function resolveField(fieldId: number): Field {
      const fieldInfo = fieldMap.get(fieldId);
      if (!fieldInfo) {
        throw new Error(`找不到字段: ${fieldId}`);
      }

      const tableInfo = tableMap.get(fieldInfo.tableId);
      if (!tableInfo) {
        throw new Error(`找不到字段所属表: ${fieldInfo.tableId}`);
      }

      const fieldRef = `${tableInfo.tableName}.${fieldInfo.name}`;

      // 支持"table.field"语法
      if (fieldRef.includes('.')) {
        const [tbl, fld] = fieldRef.split('.');
        const table = tables.find((x) => x.name === tbl || x.alias === tbl);
        if (!table) {
          throw new Error(`找不到表 ${tbl} 用于字段 ${fieldRef}`);
        }
        const field = table.getField(fld);
        if (!field) {
          throw new Error(`表 ${tbl} 中找不到字段 ${fld}`);
        }
        return field;
      }

      // 尝试在主表中查找
      const mainField = (mainTable as Table).getField(fieldRef);
      if (mainField) {
        return mainField;
      }

      // 尝试在连接表中查找
      for (const join of joins) {
        const joinField = join.rightTable.getField(fieldRef);
        if (joinField) {
          return joinField;
        }
      }

      throw new Error(`无法解析字段: ${fieldRef}`);
    }

    // 构建维度
    const dimensions = (dsl.dimensions || []).map((dim) => {
      if (typeof dim === 'number') {
        const field = resolveField(dim);
        return new Dimension(field);
      } else {
        const field = resolveField(dim.fieldId);
        return new Dimension(field, dim.alias);
      }
    });

    // 构建指标
    const metrics = (dsl.metrics || []).map((metricItem) => {
      const metricInfo = metricMap.get(metricItem.id);
      if (!metricInfo) {
        throw new Error(`找不到指标: ${metricItem.id}`);
      }

      const name =
        metricInfo.name || metricItem.alias || `metric_${metricItem.id}`;

      switch (metricInfo.metricType) {
        case MetricType.AGGREGATE: {
          const funcMap: Record<string, AggregateFunction> = {
            count: AggregateFunction.COUNT,
            sum: AggregateFunction.SUM,
            avg: AggregateFunction.AVG,
            max: AggregateFunction.MAX,
            min: AggregateFunction.MIN,
            distinct_count: AggregateFunction.DISTINCT_COUNT,
          };

          const func =
            funcMap[metricInfo.aggregateFunction || 'sum'] ||
            AggregateFunction.SUM;
          const isDistinct =
            metricInfo.aggregateFunction ===
            MetricAggregateFunction.DISTINCT_COUNT;

          if (!metricInfo.dataSourceColumnId) {
            // 没有指定字段，使用id字段
            const idField = mainTable.getField('id');
            if (!idField) {
              throw new Error('缺少用于count的字段，请在metric中指定field');
            }
            return new AggregateMetric({
              name,
              function: func,
              field: idField,
              distinct: isDistinct,
              alias: metricItem.alias,
              businessName: metricInfo.businessName,
            });
          } else {
            // 查找字段信息
            const fieldInfo = Array.from(fieldMap.values()).find(
              (f) => f.datasourceColumnId === metricInfo.dataSourceColumnId,
            );
            if (!fieldInfo) {
              throw new Error(
                `找不到指标字段: ${metricInfo.dataSourceColumnId}`,
              );
            }
            const field = resolveField(fieldInfo.id);
            return new AggregateMetric({
              name,
              function: func,
              field,
              distinct: isDistinct,
              alias: metricItem.alias,
              businessName: metricInfo.businessName,
            });
          }
        }
        case MetricType.ROW_LEVEL: {
          // 行级指标
          if (
            !metricInfo.leftOperand ||
            !metricInfo.rowOperator ||
            metricInfo.rightOperand === undefined
          ) {
            throw new Error(
              'row_level metric需要leftOperand/rowOperator/rightOperand字段',
            );
          }

          const leftField = resolveField(metricInfo.leftOperand);
          const rightField = resolveField(metricInfo.rightOperand);

          const opMap: Record<string, Operator> = {
            '+': Operator.PLUS,
            '-': Operator.MINUS,
            '*': Operator.MULTIPLY,
            '/': Operator.DIVIDE,
          };

          const operatorEnum = opMap[metricInfo.rowOperator] || Operator.PLUS;
          const metricExpr = new MetricExpression({
            left: leftField,
            operator: operatorEnum,
            right: rightField,
          });

          return new RowLevelMetric({
            name,
            expression: metricExpr,
            alias: metricItem.alias,
            businessName: metricInfo.businessName,
          });
        }
        case MetricType.POST_AGGREGATE: {
          // 后聚合指标
          if (!metricInfo.aggregateFunction || !metricInfo.sourceMetricId) {
            throw new Error(
              'post_aggregate需要aggregateFunction和sourceMetricId字段',
            );
          }

          const sourceMetricInfo = metricMap.get(metricInfo.sourceMetricId);
          if (!sourceMetricInfo) {
            throw new Error(`找不到源指标: ${metricInfo.sourceMetricId}`);
          }

          // 构建源指标
          let sourceMetric: AggregateMetric | RowLevelMetric;
          if (sourceMetricInfo.metricType === MetricType.AGGREGATE) {
            const funcMap: Record<string, AggregateFunction> = {
              count: AggregateFunction.COUNT,
              sum: AggregateFunction.SUM,
              avg: AggregateFunction.AVG,
              max: AggregateFunction.MAX,
              min: AggregateFunction.MIN,
              distinct_count: AggregateFunction.DISTINCT_COUNT,
            };

            const func =
              funcMap[sourceMetricInfo.aggregateFunction || 'sum'] ||
              AggregateFunction.SUM;
            const isDistinct =
              sourceMetricInfo.aggregateFunction ===
              MetricAggregateFunction.DISTINCT_COUNT;

            if (sourceMetricInfo.dataSourceColumnId) {
              const fieldInfo = fieldMap.get(
                sourceMetricInfo.dataSourceColumnId,
              );
              if (!fieldInfo) {
                throw new Error(
                  `找不到指标字段: ${sourceMetricInfo.dataSourceColumnId}`,
                );
              }
              const field = resolveField(fieldInfo.id);
              sourceMetric = new AggregateMetric({
                name: sourceMetricInfo.name,
                function: func,
                field,
                distinct: isDistinct,
                businessName: sourceMetricInfo.businessName,
              });
            } else {
              const idField = mainTable.getField('id');
              if (!idField) {
                throw new Error('缺少用于count的字段，请在metric中指定field');
              }
              sourceMetric = new AggregateMetric({
                name: sourceMetricInfo.name,
                function: func,
                field: idField,
                distinct: isDistinct,
                businessName: sourceMetricInfo.businessName,
              });
            }
          } else {
            throw new Error('post_aggregate只支持aggregate类型的源指标');
          }

          const funcMap: Record<string, AggregateFunction> = {
            count: AggregateFunction.COUNT,
            sum: AggregateFunction.SUM,
            avg: AggregateFunction.AVG,
            max: AggregateFunction.MAX,
            min: AggregateFunction.MIN,
          };

          const func =
            funcMap[metricInfo.aggregateFunction] || AggregateFunction.AVG;

          return new PostAggregateMetric({
            name,
            function: func,
            metric: sourceMetric,
            distinct: false,
            alias: metricItem.alias,
            businessName: metricInfo.businessName,
          });
        }
        case MetricType.ARITHMETIC: {
          // 算术指标
          if (
            !metricInfo.leftMetricId ||
            !metricInfo.arithmeticOperator ||
            metricInfo.rightMetricOperand === undefined
          ) {
            throw new Error(
              'arithmetic需要leftMetricId/arithmeticOperator/rightMetricOperand字段',
            );
          }

          const leftMetricInfo = metricMap.get(metricInfo.leftMetricId);
          if (!leftMetricInfo) {
            throw new Error(`找不到左操作数指标: ${metricInfo.leftMetricId}`);
          }

          const rightMetricInfo = metricMap.get(metricInfo.rightMetricOperand);
          if (!rightMetricInfo) {
            throw new Error(
              `找不到右操作数指标: ${metricInfo.rightMetricOperand}`,
            );
          }

          // 构建左操作数指标
          let leftMetric: AggregateMetric | RowLevelMetric;
          if (leftMetricInfo.metricType === MetricType.AGGREGATE) {
            const funcMap: Record<string, AggregateFunction> = {
              count: AggregateFunction.COUNT,
              sum: AggregateFunction.SUM,
              avg: AggregateFunction.AVG,
              max: AggregateFunction.MAX,
              min: AggregateFunction.MIN,
              distinct_count: AggregateFunction.DISTINCT_COUNT,
            };

            const func =
              funcMap[leftMetricInfo.aggregateFunction || 'sum'] ||
              AggregateFunction.SUM;
            const isDistinct =
              leftMetricInfo.aggregateFunction ===
              MetricAggregateFunction.DISTINCT_COUNT;

            if (leftMetricInfo.dataSourceColumnId) {
              const fieldInfo = fieldMap.get(leftMetricInfo.dataSourceColumnId);
              if (!fieldInfo) {
                throw new Error(
                  `找不到指标字段: ${leftMetricInfo.dataSourceColumnId}`,
                );
              }
              const field = resolveField(fieldInfo.id);
              leftMetric = new AggregateMetric({
                name: leftMetricInfo.name,
                function: func,
                field,
                distinct: isDistinct,
                businessName: leftMetricInfo.businessName,
              });
            } else {
              const idField = mainTable.getField('id');
              if (!idField) {
                throw new Error('缺少用于count的字段，请在metric中指定field');
              }
              leftMetric = new AggregateMetric({
                name: leftMetricInfo.name,
                function: func,
                field: idField,
                distinct: isDistinct,
                businessName: leftMetricInfo.businessName,
              });
            }
          } else {
            throw new Error('arithmetic只支持aggregate类型的操作数指标');
          }

          // 构建右操作数指标
          let rightMetric: AggregateMetric | RowLevelMetric;
          if (rightMetricInfo.metricType === MetricType.AGGREGATE) {
            const funcMap: Record<string, AggregateFunction> = {
              count: AggregateFunction.COUNT,
              sum: AggregateFunction.SUM,
              avg: AggregateFunction.AVG,
              max: AggregateFunction.MAX,
              min: AggregateFunction.MIN,
              distinct_count: AggregateFunction.DISTINCT_COUNT,
            };

            const func =
              funcMap[rightMetricInfo.aggregateFunction || 'sum'] ||
              AggregateFunction.SUM;
            const isDistinct =
              rightMetricInfo.aggregateFunction ===
              MetricAggregateFunction.DISTINCT_COUNT;

            if (rightMetricInfo.dataSourceColumnId) {
              const fieldInfo = fieldMap.get(
                rightMetricInfo.dataSourceColumnId,
              );
              if (!fieldInfo) {
                throw new Error(
                  `找不到指标字段: ${rightMetricInfo.dataSourceColumnId}`,
                );
              }
              const field = resolveField(fieldInfo.id);
              rightMetric = new AggregateMetric({
                name: rightMetricInfo.name,
                function: func,
                field,
                distinct: isDistinct,
                businessName: rightMetricInfo.businessName,
              });
            } else {
              const idField = mainTable.getField('id');
              if (!idField) {
                throw new Error('缺少用于count的字段，请在metric中指定field');
              }
              rightMetric = new AggregateMetric({
                name: rightMetricInfo.name,
                function: func,
                field: idField,
                distinct: isDistinct,
                businessName: rightMetricInfo.businessName,
              });
            }
          } else {
            throw new Error('arithmetic只支持aggregate类型的操作数指标');
          }

          const opMap: Record<string, Operator> = {
            '+': Operator.PLUS,
            '-': Operator.MINUS,
            '*': Operator.MULTIPLY,
            '/': Operator.DIVIDE,
          };

          const operatorEnum =
            opMap[metricInfo.arithmeticOperator] || Operator.PLUS;

          return new ArithmeticMetric({
            name,
            leftMetric,
            operator: operatorEnum,
            rightOperand: rightMetric,
            alias: metricItem.alias,
            businessName: metricInfo.businessName,
          });
        }
        default:
          throw new Error(`不支持的指标类型: ${metricInfo.metricType}`);
      }
    });

    // 创建筛选条件
    const filters = (dsl.filters || []).map((filter) => {
      const field = resolveField(filter.fieldId);

      // 支持时间筛选的简化语法
      if (filter.op === 'recent_days' && typeof filter.value === 'number') {
        return TimeFilter.createRecentFilter(
          field,
          TimeRange.RECENT_DAYS,
          filter.value,
        );
      }
      if (filter.op === 'recent_weeks' && typeof filter.value === 'number') {
        return TimeFilter.createRecentFilter(
          field,
          TimeRange.RECENT_WEEKS,
          filter.value,
        );
      }
      if (filter.op === 'recent_months' && typeof filter.value === 'number') {
        return TimeFilter.createRecentFilter(
          field,
          TimeRange.RECENT_MONTHS,
          filter.value,
        );
      }

      // 处理原始SQL值
      let value = filter.value as unknown;
      if (filter.raw && typeof value === 'string') {
        value = { rawSql: value };
      }

      // 映射运算符
      const opMap: Record<string, Operator> = {
        '=': Operator.EQUALS,
        '!=': Operator.NOT_EQUALS,
        '>': Operator.GREATER_THAN,
        '<': Operator.LESS_THAN,
        '>=': Operator.GREATER_EQUAL,
        '<=': Operator.LESS_EQUAL,
        like: Operator.LIKE,
        in: Operator.IN,
        not_in: Operator.NOT_IN,
        is_null: Operator.IS_NULL,
        is_not_null: Operator.IS_NOT_NULL,
      };

      const op = opMap[filter.op] || filter.op;
      return new Filter(field, op, value);
    });

    // 创建并返回Query对象
    const metricQuery = new MetricQuery(
      mainTable,
      dimensions,
      metrics,
      filters,
      joins,
      dsl.limit,
      dsl.offset,
    );
    return QueryBuilder.assignTableAliases(metricQuery);
  }
}
