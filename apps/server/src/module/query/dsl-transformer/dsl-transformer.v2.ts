import {
  FieldRefExpr,
  ComparisonExpr,
  LiteralExpr,
  AggExpr,
  BinaryExpr,
  AggFuncName,
  BinaryOperator,
  ComparisonOperator,
  Expr,
  MetricRefExpr,
  ConditionalExpr,
  SelectExpr,
  parseExpression,
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
import { QuerySpec, JoinSpec } from '@metric-engine/core';
import { Operator, TimeFilter, TimeRange } from '@metric-engine/core';

export interface QueryDSL {
  datasetId: number;
  tableId: number;
  dimensions?: Array<number | { fieldId: number; alias?: string }>;
  metrics?: Array<{
    id: number;
    alias?: string;
  }>;
  filters?: Array<{
    fieldId: number;
    op: string;
    value?: any;
    raw?: boolean;
  }>;
  joins?: Array<{
    id: number;
    type?: 'left' | 'inner' | 'right' | 'full';
  }>;
  limit?: number;
  offset?: number;
}

export class DSLTransformerV2 {
  static transform(
    dsl: QueryDSL,
    datasetInfo: DatasetResponse,
    tables: any[],
  ): QuerySpec {
    if (!dsl || !dsl.tableId) {
      throw new Error('DSL必须包含tableId字段');
    }

    const tableMap = new Map<number, DatasetTableResponse>();
    const fieldMap = new Map<number, DatasetFieldResponse>();
    const fieldMapWithDCId = new Map<number, DatasetFieldResponse>();
    const metricMap = new Map<number, DatasetMetricResponse>();
    const joinMap = new Map<number, DatasetJoinResponse>();

    (datasetInfo.tables || []).forEach((table: DatasetTableResponse) => {
      tableMap.set(table.id, table);
    });

    (datasetInfo.fields || []).forEach((field: DatasetFieldResponse) => {
      fieldMap.set(field.id, field);
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

    const mainTableInfo = tableMap.get(dsl.tableId);
    if (!mainTableInfo) {
      throw new Error(`找不到主表: ${dsl.tableId}`);
    }

    const mainTable = tables.find((t) => t.name === mainTableInfo.tableName);
    if (!mainTable) {
      throw new Error(`找不到主表: ${mainTableInfo.tableName}`);
    }

    console.log('表map:', tableMap);

    const mainTableAlias = 't1';

    const joins: JoinSpec[] = [];

    const getTableAlias = (tableId: number): string => {
      if (tableId === dsl.tableId) {
        return mainTableAlias;
      }
      const joinInfo = Array.from(joinMap.values()).find(
        (j) => j.rightTableId === tableId,
      );
      if (joinInfo) {
        const joinIdx = dsl.joins?.findIndex((dj) => dj.id === joinInfo.id);
        return `t${(joinIdx || 0) + 2}`;
      }
      throw new Error(`找不到表 ${tableId} 对应的别名`);
    };

    if (dsl.joins && dsl.joins.length > 0) {
      let joinAliasIdx = 2;
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

        const rightTableAlias = `t${joinAliasIdx++}`;

        const leftFieldInfo = fieldMapWithDCId.get(Number(joinInfo.leftField));
        const rightFieldInfo = fieldMapWithDCId.get(
          Number(joinInfo.rightField),
        );

        const leftTableAlias = getTableAlias(joinInfo.leftTableId);

        const onExpr = new ComparisonExpr(
          Operator.EQUALS,
          new FieldRefExpr(
            leftFieldInfo?.name || '',
            undefined,
            leftTableAlias,
          ),
          new FieldRefExpr(
            rightFieldInfo?.name || '',
            undefined,
            rightTableAlias,
          ),
        );

        joins.push({
          type: (j.type || joinInfo.joinType || 'inner') as any,
          table: rightTableInfo.tableName,
          alias: rightTableAlias,
          on: onExpr,
        });
      }
    }

    const resolveField = (
      fieldId: number,
      defaultTableAlias?: string,
    ): FieldRefExpr => {
      const fieldInfo = fieldMap.get(fieldId);
      if (!fieldInfo) {
        throw new Error(`找不到字段: ${fieldId}`);
      }

      const tableInfo = tableMap.get(fieldInfo.tableId);
      if (!tableInfo) {
        throw new Error(`找不到字段所属表: ${fieldInfo.tableId}`);
      }

      let tableAlias = defaultTableAlias;
      if (!tableAlias) {
        if (tableInfo.id === dsl.tableId) {
          tableAlias = mainTableAlias;
        } else {
          const joinInfo = Array.from(joinMap.values()).find(
            (j) => j.rightTableId === tableInfo.id,
          );
          if (joinInfo) {
            const joinIdx = dsl.joins?.findIndex((dj) => dj.id === joinInfo.id);
            tableAlias = `t${(joinIdx || 0) + 2}`;
          }
        }
      }

      return new FieldRefExpr(
        fieldInfo.name,
        undefined,
        tableAlias || mainTableAlias,
        {
          alias: undefined,
          businessName: fieldInfo.businessName || fieldInfo.name,
          description: fieldInfo.description,
        },
      );
    };

    const dimensions = (dsl.dimensions || []).map((dim) => {
      if (typeof dim === 'number') {
        return resolveField(dim);
      } else {
        const fieldExpr = resolveField(dim.fieldId);
        fieldExpr.meta = fieldExpr.meta || {};
        fieldExpr.meta.alias = dim.alias || undefined;
        return fieldExpr;
      }
    });

    /**
     * 预处理表达式：将 #F 和 #M 替换为实际字段/指标名
     * #F10,20,30 表示字段ID列表
     * #M100,200 表示指标ID列表
     */
    const preprocessExpression = (expression: string): string => {
      let result = expression;

      console.log('原始表达式:', expression);

      // 先替换 #M 指标引用
      result = result.replace(/#M([\d,]+)/g, (match, ids) => {
        const idList = ids.split(',').map((id) => parseInt(id, 10));
        return idList
          .map((id) => {
            const metricInfo = metricMap.get(id);
            if (!metricInfo) {
              throw new Error(`找不到指标: ${id}`);
            }
            return metricInfo.name;
          })
          .join(', ');
      });

      // 再替换 #F 字段引用
      result = result.replace(/#F([\d,]+)/g, (match, ids) => {
        const idList = ids.split(',').map((id) => parseInt(id, 10));
        return idList
          .map((id) => {
            const fieldInfo = Array.from(fieldMap.values()).find(
              (f) => f.id === id,
            );
            if (!fieldInfo) {
              throw new Error(`找不到字段: ${id}`);
            }
            return fieldInfo.name;
          })
          .join(', ');
      });

      console.log('hcs result', result);
      return result;
    };

    /**
     * 从表达式构建 Expr AST
     * 使用 V2 的 ExprParser 解析表达式字符串
     */
    const buildExprFromExpression = (
      metric: DatasetMetricResponse,
      visited: Set<number>,
    ): Expr => {
      if (!metric.expression) {
        throw new Error('expression metric 需要 expression 字段');
      }

      visited.add(metric.id);

      const processedExpr = preprocessExpression(metric.expression);

      const context = {
        tables: new Map([
          [
            mainTableAlias,
            { name: mainTableInfo.tableName, alias: mainTableAlias },
          ],
        ]),
        fields: new Map(
          Array.from(fieldMap.values()).map((f) => {
            const fieldTableInfo = tableMap.get(f.tableId);
            let fieldTableAlias = mainTableAlias;
            if (fieldTableInfo) {
              if (fieldTableInfo.id === dsl.tableId) {
                fieldTableAlias = mainTableAlias;
              } else {
                const joinInfo = Array.from(joinMap.values()).find(
                  (j) => j.rightTableId === fieldTableInfo.id,
                );
                if (joinInfo) {
                  const joinIdx = dsl.joins?.findIndex(
                    (dj) => dj.id === joinInfo.id,
                  );
                  fieldTableAlias = `t${(joinIdx || 0) + 2}`;
                }
              }
            }
            return [
              f.name,
              {
                name: f.name,
                tableName: fieldTableInfo?.tableName || '',
                tableAlias: fieldTableAlias,
              },
            ];
          }),
        ),
        metrics: new Map(
          Array.from(metricMap.values()).map((m) => [
            m.name,
            visited.has(m.id)
              ? new MetricRefExpr(m.name, { alias: m.name })
              : buildMetricExpr(m.id, visited),
          ]),
        ),
        defaultTable: mainTableAlias,
      };

      return parseExpression(processedExpr, context);
    };

    /**
     * 递归构建指标表达式（用于 metrics 上下文的引用）
     */
    const buildMetricExpr = (metricId: number, visited: Set<number>): Expr => {
      if (visited.has(metricId)) {
        throw new Error(`检测到循环引用: 指标 ${metricId}`);
      }
      visited.add(metricId);

      const metric = metricMap.get(metricId);
      if (!metric) {
        throw new Error(`找不到指标: ${metricId}`);
      }

      if (metric.expression) {
        return buildExprFromExpression(metric, visited);
      }

      switch (metric.metricType) {
        case MetricType.AGGREGATE:
          return buildAggregateExpr(metric);
        case MetricType.ROW_LEVEL:
          return buildRowLevelExpr(metric);
        case MetricType.POST_AGGREGATE:
          return buildPostAggregateExpr(metric, visited);
        case MetricType.ARITHMETIC:
          return buildArithmeticExpr(metric, visited);
        default:
          return new MetricRefExpr(metric.name, {
            alias: metric.name,
            businessName: metric.businessName,
          });
      }
    };

    const resolveMetric = (
      metricId: number,
      visited: Set<number> = new Set(),
    ): Expr => {
      if (visited.has(metricId)) {
        throw new Error(`检测到循环引用: 指标 ${metricId}`);
      }
      visited.add(metricId);

      const metric = metricMap.get(metricId);
      if (!metric) {
        throw new Error(`找不到指标: ${metricId}`);
      }

      // 如果有 expression 字段，优先使用表达式解析
      if (metric.expression) {
        return buildExprFromExpression(metric, visited);
      }

      switch (metric.metricType) {
        case MetricType.AGGREGATE:
          return buildAggregateExpr(metric);
        case MetricType.ROW_LEVEL:
          return buildRowLevelExpr(metric);
        case MetricType.POST_AGGREGATE:
          return buildPostAggregateExpr(metric, visited);
        case MetricType.ARITHMETIC:
          return buildArithmeticExpr(metric, visited);
        default:
          return new MetricRefExpr(metric.name, {
            alias: metric.name,
            businessName: metric.businessName,
          });
      }
    };

    const buildAggregateExpr = (metric: DatasetMetricResponse): AggExpr => {
      const funcMap: Record<string, AggFuncName> = {
        count: 'COUNT' as AggFuncName,
        sum: 'SUM' as AggFuncName,
        avg: 'AVG' as AggFuncName,
        max: 'MAX' as AggFuncName,
        min: 'MIN' as AggFuncName,
        distinct_count: 'COUNT' as AggFuncName,
      };

      const funcName =
        funcMap[metric.aggregateFunction || 'sum'] || ('SUM' as AggFuncName);

      const isDistinct =
        metric.distinct ||
        metric.aggregateFunction === MetricAggregateFunction.DISTINCT_COUNT;

      let baseFieldExpr: FieldRefExpr;
      if (metric.dataSourceColumnId) {
        const fieldInfo = Array.from(fieldMap.values()).find(
          (f) => f.datasourceColumnId === metric.dataSourceColumnId,
        );
        if (!fieldInfo) {
          throw new Error(`找不到指标字段: ${metric.dataSourceColumnId}`);
        }
        baseFieldExpr = resolveField(fieldInfo.id);
      } else {
        baseFieldExpr = new FieldRefExpr('id', undefined, mainTableAlias);
      }

      let fieldExpr: Expr = baseFieldExpr;
      const aggCondition = metric.aggregateCondition;

      if (aggCondition?.caseCondition) {
        const caseWhenExpr = this.parseCaseCondition(
          aggCondition.caseCondition,
          baseFieldExpr,
          fieldMap,
          mainTableAlias,
        );
        fieldExpr = caseWhenExpr;
      }

      return new AggExpr(funcName, fieldExpr, isDistinct, {
        alias: metric.name,
        businessName: metric.businessName,
      });
    };

    const buildRowLevelExpr = (metric: DatasetMetricResponse): BinaryExpr => {
      if (
        !metric.leftOperand ||
        !metric.rowOperator ||
        metric.rightOperand === undefined
      ) {
        throw new Error(
          'row_level metric需要leftOperand/rowOperator/rightOperand字段',
        );
      }

      const leftField = resolveField(metric.leftOperand);
      const rightField = resolveField(metric.rightOperand);

      const opMap: Record<string, BinaryOperator> = {
        '+': '+',
        '-': '-',
        '*': '*',
        '/': '/',
      };

      return new BinaryExpr(
        opMap[metric.rowOperator] || '+',
        leftField,
        rightField,
        {
          alias: metric.name,
          businessName: metric.businessName,
        },
      );
    };

    const buildPostAggregateExpr = (
      metric: DatasetMetricResponse,
      visited: Set<number>,
    ): AggExpr => {
      if (!metric.sourceMetricId) {
        throw new Error('post_aggregate metric需要sourceMetricId字段');
      }

      const sourceExpr = resolveMetric(metric.sourceMetricId, visited);

      const funcMap: Record<string, AggFuncName> = {
        count: 'COUNT',
        sum: 'SUM',
        avg: 'AVG',
        max: 'MAX',
        min: 'MIN',
        distinct_count: 'COUNT',
      };

      const funcName = funcMap[metric.aggregateFunction || 'sum'] || 'SUM';
      const isDistinct =
        metric.distinct ||
        metric.aggregateFunction === MetricAggregateFunction.DISTINCT_COUNT;

      return new AggExpr(funcName, sourceExpr, isDistinct, {
        alias: metric.name,
        businessName: metric.businessName,
      });
    };

    const buildArithmeticExpr = (
      metric: DatasetMetricResponse,
      visited: Set<number>,
    ): BinaryExpr => {
      if (!metric.leftMetricId || !metric.arithmeticOperator) {
        throw new Error(
          'arithmetic metric需要leftMetricId和arithmeticOperator字段',
        );
      }

      const leftExpr = resolveMetric(metric.leftMetricId, visited);

      let rightExpr: Expr;

      if (
        metric.rightMetricOperand !== undefined &&
        metric.rightMetricOperand !== null
      ) {
        if (metric.rightMetricOperandFieldName) {
          rightExpr = resolveMetric(metric.rightMetricOperand, visited);
        } else {
          rightExpr = new LiteralExpr(Number(metric.rightMetricOperand));
        }
      } else {
        throw new Error('arithmetic metric需要rightMetricOperand');
      }

      const opMap: Record<string, BinaryOperator> = {
        '+': '+',
        '-': '-',
        '*': '*',
        '/': '/',
      };

      return new BinaryExpr(
        opMap[metric.arithmeticOperator] || '+',
        leftExpr,
        rightExpr,
        {
          alias: metric.name,
          businessName: metric.businessName,
        },
      );
    };

    const metrics = (dsl.metrics || []).map((metricItem) => {
      const metricInfo = metricMap.get(metricItem.id);
      if (!metricInfo) {
        throw new Error(`找不到指标: ${metricItem.id}`);
      }

      const expr = resolveMetric(metricItem.id);

      if (metricItem.alias || metricInfo.businessName) {
        if (expr instanceof AggExpr) {
          expr.meta = expr.meta || {};
          expr.meta.alias = metricItem.alias || metricInfo.name;
          if (metricInfo.businessName) {
            expr.meta.businessName = metricInfo.businessName;
          }
        } else if (expr instanceof BinaryExpr) {
          expr.meta = expr.meta || {};
          expr.meta.alias = metricItem.alias || metricInfo.name;
          if (metricInfo.businessName) {
            expr.meta.businessName = metricInfo.businessName;
          }
        }
      }

      return expr;
    });

    const filters = (dsl.filters || []).map((filter) => {
      const fieldExpr = resolveField(filter.fieldId);

      if (filter.op === 'recent_days' && typeof filter.value === 'number') {
        return TimeFilter.createRecentFilter(
          fieldExpr as any,
          TimeRange.RECENT_DAYS,
          filter.value,
        );
      }
      if (filter.op === 'recent_weeks' && typeof filter.value === 'number') {
        return TimeFilter.createRecentFilter(
          fieldExpr as any,
          TimeRange.RECENT_WEEKS,
          filter.value,
        );
      }
      if (filter.op === 'recent_months' && typeof filter.value === 'number') {
        return TimeFilter.createRecentFilter(
          fieldExpr as any,
          TimeRange.RECENT_MONTHS,
          filter.value,
        );
      }

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

      const op = opMap[filter.op] || (filter.op as Operator);
      let value: any = filter.value;
      if (filter.raw && typeof value === 'string') {
        value = { rawSql: value };
      }

      return new ComparisonExpr(
        op as ComparisonOperator,
        fieldExpr,
        value !== undefined ? new LiteralExpr(value) : (undefined as any),
      );
    });

    return {
      from: {
        table: mainTableInfo.tableName,
        alias: mainTableAlias,
      },
      joins,
      dimensions,
      metrics,
      filters,
      limit: dsl.limit,
      offset: dsl.offset,
    };
  }

  private static parseCaseCondition(
    caseCondition: string,
    defaultExpr: FieldRefExpr,
    fieldMap: Map<number, DatasetFieldResponse>,
    defaultTableAlias: string,
  ): ConditionalExpr {
    const eqMatch = caseCondition.match(/^(\w+)\s*=\s*'([^']+)'$/);
    const neqMatch = caseCondition.match(/^(\w+)\s*!=\s*'([^']+)'$/);
    const gtMatch = caseCondition.match(/^(\w+)\s*>\s*(\d+)$/);
    const gteMatch = caseCondition.match(/^(\w+)\s*>=\s*(\d+)$/);
    const ltMatch = caseCondition.match(/^(\w+)\s*<\s*(\d+)$/);
    const lteMatch = caseCondition.match(/^(\w+)\s*<=\s*(\d+)$/);

    let conditionExpr: ComparisonExpr;

    if (eqMatch) {
      const [, fieldName, value] = eqMatch;
      const fieldExpr = new FieldRefExpr(
        fieldName,
        undefined,
        defaultTableAlias,
      );
      conditionExpr = new ComparisonExpr(
        '=',
        fieldExpr,
        new LiteralExpr(value),
      );
    } else if (neqMatch) {
      const [, fieldName, value] = neqMatch;
      const fieldExpr = new FieldRefExpr(
        fieldName,
        undefined,
        defaultTableAlias,
      );
      conditionExpr = new ComparisonExpr(
        '!=',
        fieldExpr,
        new LiteralExpr(value),
      );
    } else if (gtMatch) {
      const [, fieldName, value] = gtMatch;
      const fieldExpr = new FieldRefExpr(
        fieldName,
        undefined,
        defaultTableAlias,
      );
      conditionExpr = new ComparisonExpr(
        '>',
        fieldExpr,
        new LiteralExpr(Number(value)),
      );
    } else if (gteMatch) {
      const [, fieldName, value] = gteMatch;
      const fieldExpr = new FieldRefExpr(
        fieldName,
        undefined,
        defaultTableAlias,
      );
      conditionExpr = new ComparisonExpr(
        '>=',
        fieldExpr,
        new LiteralExpr(Number(value)),
      );
    } else if (ltMatch) {
      const [, fieldName, value] = ltMatch;
      const fieldExpr = new FieldRefExpr(
        fieldName,
        undefined,
        defaultTableAlias,
      );
      conditionExpr = new ComparisonExpr(
        '<',
        fieldExpr,
        new LiteralExpr(Number(value)),
      );
    } else if (lteMatch) {
      const [, fieldName, value] = lteMatch;
      const fieldExpr = new FieldRefExpr(
        fieldName,
        undefined,
        defaultTableAlias,
      );
      conditionExpr = new ComparisonExpr(
        '<=',
        fieldExpr,
        new LiteralExpr(Number(value)),
      );
    } else {
      conditionExpr = new ComparisonExpr(
        '=',
        new LiteralExpr(1),
        new LiteralExpr(1),
      );
    }

    return new ConditionalExpr(conditionExpr, defaultExpr, new LiteralExpr(0));
  }
}
