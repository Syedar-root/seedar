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
  SubQueryMetric,
  RowLevelMetric,
  PostAggregateMetric,
  ArithmeticMetric,
  MetricExpression,
  MinimalDSL,
} from '@metric-engine/core';

/**
 * query模块的DSL结构（扩展自metric-engine的MinimalDSL）
 */
export interface QueryDSL extends MinimalDSL {
  /** 数据集ID */
  datasetId: number;
}

/**
 * DSL转换器类
 */
export class DSLTransformer {
  /**
   * 将query DSL转换为metric-engine的Query
   * @param dsl query模块的DSL
   * @param tables 表定义数组
   * @returns metric-engine的Query对象
   */
  static transform(dsl: QueryDSL, tables: Table[]): MetricQuery {
    if (!dsl || !dsl.table) {
      throw new Error('DSL必须包含table字段');
    }

    // 查找主表
    const mainTable = tables.find((t) => t.name === dsl.table);
    if (!mainTable) {
      throw new Error(`找不到主表: ${dsl.table}`);
    }

    // 创建连接
    const joins: Join[] = [];
    if (dsl.joins && dsl.joins.length > 0) {
      for (const j of dsl.joins) {
        const rightTable = tables.find((t) => t.name === j.table);
        if (!rightTable) {
          throw new Error(`找不到JOIN表: ${j.table}`);
        }

        // 设置表别名
        if (j.alias) {
          (rightTable as any).alias = j.alias;
        }

        // 创建连接条件
        const conditions = (j.on || []).map(
          (o) => new JoinCondition({ leftField: o.left, rightField: o.right }),
        );

        // 添加连接
        joins.push(
          new Join({
            type: (j.type || 'left') as JoinType,
            leftTable: mainTable,
            rightTable,
            conditions,
          }),
        );
      }
    }

    // 解析字段引用
    function resolveField(fieldRef: string): Field {
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

    // 创建维度
    const dimensions = (dsl.dimensions || []).map((dim) => {
      if (typeof dim === 'string') {
        const field = resolveField(dim);
        return new Dimension(field);
      } else {
        const field = resolveField(dim.field);
        return new Dimension(field, dim.alias);
      }
    });

    // 创建指标（分两轮解析，以支持post_agg和arithmetic引用其他指标）
    const metricsMap: Record<string, any> = {};
    const basicMetrics = (dsl.metrics || []).filter(
      (m) => !['post_agg', 'arithmetic'].includes(m.type),
    );

    // 解析基础指标
    for (const metric of basicMetrics) {
      const name = metric.name || metric.field || metric.type;

      if (metric.type === 'subquery') {
        // 子查询指标
        metricsMap[name] = new SubQueryMetric(
          name,
          metric.sqlTemplate || '',
          {},
          undefined,
          metric.alias,
        );
        continue;
      }

      if (metric.type === 'row') {
        // 行级指标
        if (!metric.expression || typeof metric.expression !== 'string') {
          throw new Error('row metric需要expression字段');
        }
        // 这里简化处理，实际实现需要解析表达式
        const field = resolveField(metric.field!);
        metricsMap[name] = new RowLevelMetric(
          name,
          field as unknown as MetricExpression,
          metric.alias,
        );
        continue;
      }

      // 聚合指标
      const funcMap: Record<string, AggregateFunction> = {
        count: AggregateFunction.COUNT,
        sum: AggregateFunction.SUM,
        avg: AggregateFunction.AVG,
        max: AggregateFunction.MAX,
        min: AggregateFunction.MIN,
        distinct_count: AggregateFunction.DISTINCT_COUNT,
      };

      const aggName =
        metric.type === 'aggregate' ? metric.agg || 'sum' : metric.type;
      const func = funcMap[aggName] || AggregateFunction.SUM;
      const isDistinct = aggName === 'distinct_count';

      if (!metric.field) {
        // 没有指定字段，使用id字段
        const idField = mainTable.getField('id');
        if (!idField) {
          throw new Error('缺少用于count的字段，请在metric中指定field');
        }
        metricsMap[name] = new AggregateMetric(
          name,
          func,
          idField,
          isDistinct,
          metric.alias,
        );
      } else {
        // 使用指定字段
        const field = resolveField(metric.field);
        metricsMap[name] = new AggregateMetric(
          name,
          func,
          field,
          isDistinct,
          metric.alias,
        );
      }
    }

    // 解析引用其他指标的指标
    for (const metric of dsl.metrics || []) {
      if (['post_agg', 'arithmetic'].includes(metric.type)) {
        const name = metric.name || metric.field || metric.type;

        if (metric.type === 'post_agg') {
          // 后聚合指标
          if (!metric.agg || !metric.metric) {
            throw new Error('post_agg需要agg和metric字段');
          }

          const refMetric = metricsMap[metric.metric];
          if (!refMetric) {
            throw new Error(`找不到被聚合的指标: ${metric.metric}`);
          }

          const funcMap: Record<string, AggregateFunction> = {
            count: AggregateFunction.COUNT,
            sum: AggregateFunction.SUM,
            avg: AggregateFunction.AVG,
            max: AggregateFunction.MAX,
            min: AggregateFunction.MIN,
          };

          const func = funcMap[metric.agg] || AggregateFunction.AVG;

          metricsMap[name] = new PostAggregateMetric(
            name,
            func,
            refMetric,
            false,
            metric.alias,
          );
        } else if (metric.type === 'arithmetic') {
          // 算术指标
          if (!metric.left || !metric.operator || metric.right === undefined) {
            throw new Error('arithmetic需要left/operator/right');
          }

          // 解析操作数
          function resolveOperand(op: any) {
            if (typeof op === 'number') {
              return op;
            }
            if (typeof op === 'string') {
              // 作为字段引用
              return resolveField(op);
            }
            if (op.metric) {
              // 引用其他指标
              const ref = metricsMap[op.metric];
              if (!ref) {
                throw new Error(`找不到引用的指标: ${op.metric}`);
              }
              return ref;
            }
            if (op.field) {
              // 引用字段
              return resolveField(op.field);
            }
            throw new Error('无法解析arithmetic操作数');
          }

          const leftOperand = resolveOperand(metric.left);
          const rightOperand = resolveOperand(metric.right);
          const opSymbol = metric.operator;

          const opMap: Record<string, Operator> = {
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
            metric.alias,
          );
        }
      }
    }

    // 最终指标数组
    const metrics = Object.values(metricsMap);

    // 创建筛选条件
    const filters = (dsl.filters || []).map((filter) => {
      const field = resolveField(filter.field);

      // 支持时间筛选的简化语法
      if (filter.op === 'recent_days' && typeof filter.value === 'number') {
        return TimeFilter.createRecentFilter(
          field,
          TimeRange.RECENT_DAYS,
          filter.value,
        );
      }

      // 处理原始SQL值
      let value = filter.value;
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
      return new Filter(field, op as Operator, value);
    });

    // 创建并返回Query对象
    return new MetricQuery(mainTable, dimensions, metrics, filters, joins);
  }
}
