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

    const mainTableAlias = 't1';

    const joins: JoinSpec[] = [];

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

        const onExpr = new ComparisonExpr(
          Operator.EQUALS,
          new FieldRefExpr(
            leftFieldInfo?.name || '',
            undefined,
            mainTableAlias,
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

    function resolveField(
      fieldId: number,
      defaultTableAlias?: string,
    ): FieldRefExpr {
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
    }

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

    const metrics = (dsl.metrics || []).map((metricItem) => {
      const metricInfo = metricMap.get(metricItem.id);
      if (!metricInfo) {
        throw new Error(`找不到指标: ${metricItem.id}`);
      }

      const alias = metricItem.alias || metricInfo.name;

      switch (metricInfo.metricType) {
        case MetricType.AGGREGATE: {
          const funcMap: Record<string, AggFuncName> = {
            count: 'COUNT' as AggFuncName,
            sum: 'SUM' as AggFuncName,
            avg: 'AVG' as AggFuncName,
            max: 'MAX' as AggFuncName,
            min: 'MIN' as AggFuncName,
            distinct_count: 'COUNT' as AggFuncName,
          };

          const funcName =
            funcMap[metricInfo.aggregateFunction || 'sum'] ||
            ('SUM' as AggFuncName);
          const isDistinct =
            metricInfo.aggregateFunction ===
            MetricAggregateFunction.DISTINCT_COUNT;

          let fieldExpr: FieldRefExpr;
          if (metricInfo.dataSourceColumnId) {
            const fieldInfo = Array.from(fieldMap.values()).find(
              (f) => f.datasourceColumnId === metricInfo.dataSourceColumnId,
            );
            if (!fieldInfo) {
              throw new Error(
                `找不到指标字段: ${metricInfo.dataSourceColumnId}`,
              );
            }
            fieldExpr = resolveField(fieldInfo.id);
          } else {
            fieldExpr = new FieldRefExpr('id', undefined, mainTableAlias);
          }

          return new AggExpr(funcName, fieldExpr, isDistinct, {
            alias,
            businessName: metricInfo.businessName,
          });
        }
        case MetricType.ROW_LEVEL: {
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

          return new BinaryExpr(
            (opMap[metricInfo.rowOperator] || Operator.PLUS) as BinaryOperator,
            leftField,
            rightField,
            {
              alias,
              businessName: metricInfo.businessName,
            },
          );
        }
        default:
          throw new Error(`不支持的指标类型: ${metricInfo.metricType}`);
      }
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
}
