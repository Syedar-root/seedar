import { SchemaInspector } from '../database/schema-inspector';
import { Query, Dimension } from '../query/query-builder';
import { Table } from '../core/table';
import {
  AggregateMetric,
  RowLevelMetric,
  PostAggregateMetric,
  ArithmeticMetric,
  MetricExpression,
  SubQueryMetric,
} from '../metrics/metric-classes';
import { Filter, TimeFilter, TimeRange } from '../query/filter';
import { AggregateFunction, Operator } from '../core/types';
import { Join, JoinCondition } from '../core/join';
import { QueryBuilder } from '../query/query-builder';

export type MinimalMetric = {
  name?: string;
  // metric kind: 'aggregate' 表示使用 agg 字段指定函数；其它为行级/特殊类型
  type: 'aggregate' | 'subquery' | 'row' | 'post_agg' | 'arithmetic';
  field?: string;
  alias?: string;
  sqlTemplate?: string;
  // optional extended fields for row/post_agg/arithmetic/aggregate
  expression?: string;
  agg?: 'count' | 'sum' | 'avg' | 'max' | 'min' | 'distinct_count'; // 聚合函数名（仅在 type === 'aggregate' 时使用）
  metric?: string;
  left?: any;
  operator?: string;
  right?: any;
};

export type MinimalFilter = {
  field: string;
  op: string;
  value?: any;
  raw?: boolean;
};

export type MinimalJoin = {
  table: string;
  alias?: string;
  type?: 'left' | 'inner' | 'right' | 'full';
  on: { left: string; right: string }[];
};

export type MinimalDSL = {
  table: string;
  dimensions?: Array<string | { field: string; alias?: string }>;
  metrics?: MinimalMetric[];
  filters?: MinimalFilter[];
  joins?: MinimalJoin[];
};

/**
 * 解析最小化 DSL 为 Query 对象（仅包含必要字段）
 * - 支持：table, dimensions, metrics, filters, joins(optional)
 */
export async function parseMinimalDslToQuery(
  dsl: MinimalDSL,
  tables: Table[]
): Promise<Query> {
  if (!dsl || !dsl.table) throw new Error('DSL 必须包含 table 字段');

  // const tables = await SchemaInspector.getAllTables(); // TODO: 使用参数来传入tables
  const mainTable = tables.find((t) => t.name === dsl.table);
  if (!mainTable) throw new Error(`找不到主表: ${dsl.table}`);

  const joins: Join[] = [];
  if (dsl.joins && dsl.joins.length > 0) {
    for (const j of dsl.joins) {
      const right = tables.find((t) => t.name === j.table);
      if (!right) throw new Error(`找不到 JOIN 表: ${j.table}`);
      // ensure alias on right table
      if (j.alias) {
        (right as any).alias = j.alias;
      }
      const conditions = (j.on || []).map(
        (o) => new JoinCondition({ leftField: o.left, rightField: o.right })
      );
      joins.push(
        new Join({
          type: (j.type || 'left') as any,
          leftTable: mainTable,
          rightTable: right,
          conditions,
        })
      );
    }
  }

  // helper to resolve field name to Field instance
  function resolveField(fieldRef: string) {
    // allow "table.field" syntax
    if (fieldRef.includes('.')) {
      const [tbl, fld] = fieldRef.split('.');
      const t = tables.find((x) => x.name === tbl || x.alias === tbl);
      if (!t) throw new Error(`找不到表 ${tbl} 用于字段 ${fieldRef}`);
      const f = t.getField(fld);
      if (!f) throw new Error(`表 ${tbl} 中找不到字段 ${fld}`);
      return f;
    }

    // try main table
    if (!mainTable) throw new Error('主表未初始化');
    const fMain = mainTable.getField(fieldRef);
    if (fMain) return fMain;
    // try joins
    for (const j of joins) {
      const fJoin = j.rightTable.getField(fieldRef);
      if (fJoin) return fJoin;
    }
    throw new Error(`无法解析字段: ${fieldRef}`);
  }

  // dimensions
  const dims = (dsl.dimensions || []).map((d) => {
    if (typeof d === 'string') {
      const f = resolveField(d);
      return new Dimension(f);
    } else {
      const f = resolveField(d.field);
      return new Dimension(f, d.alias);
    }
  });

  // metrics - two pass parsing to allow referencing metrics in post-agg/arithmetic
  const metricsMap: Record<string, any> = {};
  const basicMetrics = (dsl.metrics || []).filter(
    (m) => !['post_agg', 'arithmetic'].includes(m.type)
  );

  for (const m of basicMetrics) {
    const name = m.name || m.field || m.type;
    if (m.type === 'subquery') {
      // use SubQueryMetric via sqlTemplate
      metricsMap[name] = new SubQueryMetric(
        name,
        m.sqlTemplate || '',
        {},
        undefined,
        m.alias
      );
      continue;
    }

    if (m.type === 'row') {
      // parse simple binary expression like "{field} / {field2}" or "field1 + field2"
      if (!m.expression || typeof m.expression !== 'string') {
        throw new Error('row metric 需要 expression 字段');
      }
      const expr = m.expression.trim();
      const match = expr.match(/^(.+?)\s*([\+\-\*\/])\s*(.+)$/);
      if (!match) {
        throw new Error(
          'row metric 目前仅支持简单二元运算表达式，例如 "{unit_price} / {quantity}"'
        );
      }
      const leftToken = match[1].trim();
      const opSymbol = match[2].trim();
      const rightToken = match[3].trim();

      function tokenToOperand(token: string) {
        // if token contains a {field} placeholder inside a function like NULLIF({id},1)
        const placeholderMatch = token.match(/\{([a-zA-Z0-9_\.]+)\}/);
        if (placeholderMatch) {
          const ref = placeholderMatch[1];
          const f = resolveField(ref);
          return f;
        }
        const fieldRefMatch = token.match(/^[a-zA-Z0-9_\.]+$/);
        if (fieldRefMatch) {
          // treat plain token as field name
          const f = resolveField(token);
          return f;
        }
        const num = Number(token);
        if (!isNaN(num)) return num;
        throw new Error(`无法解析表达式中的操作数: ${token}`);
      }

      const leftOp = tokenToOperand(leftToken);
      const rightOp = tokenToOperand(rightToken);
      const opMap: Record<string, Operator> = {
        '+': Operator.PLUS,
        '-': Operator.MINUS,
        '*': Operator.MULTIPLY,
        '/': Operator.DIVIDE,
      };
      const metricExpr = new MetricExpression(leftOp, opMap[opSymbol], rightOp);
      metricsMap[name] = new RowLevelMetric(name, metricExpr, m.alias);
      continue;
    }

    // Support new DSL shape: { type: 'aggregate', agg: 'sum' } and legacy: { type: 'sum' }
    const funcMap: Record<string, AggregateFunction> = {
      count: AggregateFunction.COUNT,
      sum: AggregateFunction.SUM,
      avg: AggregateFunction.AVG,
      max: AggregateFunction.MAX,
      min: AggregateFunction.MIN,
      distinct_count: AggregateFunction.DISTINCT_COUNT,
    };
    const aggName = m.type === 'aggregate' ? m.agg || 'sum' : m.type;
    const func = funcMap[aggName] || AggregateFunction.SUM;
    const isDistinct = aggName === 'distinct_count';
    if (!m.field) {
      const idField = mainTable.getField('id');
      if (!idField)
        throw new Error('缺少用于 count 的字段，请在 metric 中指定 field');
      metricsMap[name] = new AggregateMetric(
        name,
        func,
        idField,
        isDistinct,
        m.alias
      );
    } else {
      const f = resolveField(m.field);
      metricsMap[name] = new AggregateMetric(
        name,
        func,
        f,
        isDistinct,
        m.alias
      );
    }
  }

  // handle referencing metrics: post_agg and arithmetic
  for (const m of dsl.metrics || []) {
    if (['post_agg', 'arithmetic'].includes(m.type)) {
      const name = m.name || m.field || m.type;
      if (m.type === 'post_agg') {
        if (!m.agg || !m.metric)
          throw new Error('post_agg 需要 agg 和 metric 字段');
        const refMetric = metricsMap[m.metric];
        if (!refMetric) throw new Error(`找不到被聚合的指标: ${m.metric}`);

        // 使用 PostAggregateMetric，直接引用被聚合的指标
        // SQLGenerator 会处理基于 inner_metrics.column_X 的引用
        const funcMap: Record<string, AggregateFunction> = {
          count: AggregateFunction.COUNT,
          sum: AggregateFunction.SUM,
          avg: AggregateFunction.AVG,
          max: AggregateFunction.MAX,
          min: AggregateFunction.MIN,
        };
        const func = funcMap[m.agg] || AggregateFunction.AVG;
        metricsMap[name] = new PostAggregateMetric(
          name,
          func,
          refMetric,
          false,
          m.alias
        );
      } else if (m.type === 'arithmetic') {
        // left/right can be { metric: 'name' } or { field: 'table.field' } or number
        if (!m.left || !m.operator || m.right === undefined)
          throw new Error('arithmetic 需要 left/operator/right');
        function resolveOperand(op: any) {
          if (typeof op === 'number') return op;
          if (typeof op === 'string') {
            // treat as field ref
            return resolveField(op);
          }
          if (op.metric) {
            const ref = metricsMap[op.metric];
            if (!ref) throw new Error(`找不到引用的指标: ${op.metric}`);
            return ref;
          }
          if (op.field) {
            return resolveField(op.field);
          }
          throw new Error('无法解析 arithmetic 操作数');
        }
        const leftOperand = resolveOperand(m.left);
        const rightOperand = resolveOperand(m.right);
        const opSymbol = m.operator;
        const opMap: any = {
          '+': Operator.PLUS,
          '-': Operator.MINUS,
          '*': Operator.MULTIPLY,
          '/': Operator.DIVIDE,
        };
        const operatorEnum = opMap[opSymbol] || Operator.PLUS;
        metricsMap[name] = new ArithmeticMetric(
          name,
          leftOperand,
          operatorEnum,
          rightOperand,
          m.alias
        );
      }
    }
  }

  // final metrics array
  const metrics = Object.values(metricsMap);

  // filters
  const filters = (dsl.filters || []).map((f) => {
    const fieldObj = resolveField(f.field);
    // support time filter simple shorthand: if op is 'recent_days' and value is number
    if (f.op === 'recent_days' && typeof f.value === 'number') {
      return TimeFilter.createRecentFilter(
        fieldObj,
        TimeRange.RECENT_DAYS,
        f.value
      );
    }
    // raw SQL value marker
    let value = f.value;
    if (f.raw && typeof value === 'string') {
      value = { rawSql: value };
    }
    // map op string to Operator enum where possible
    const opMap: any = {
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
    const op = opMap[f.op] || f.op;
    return new Filter(fieldObj, op, value);
  });

  // 返回前为所有表分配别名
  const query = new Query(mainTable, dims, metrics, filters, joins);
  return QueryBuilder.assignTableAliases(query);
}
