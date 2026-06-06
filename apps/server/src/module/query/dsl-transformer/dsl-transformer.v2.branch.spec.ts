import {
  AggExpr,
  BinaryExpr,
  PeriodComparisonExpr,
} from '@metric-engine/core';
import {
  DatasetResponse,
  JoinType,
  MetricAggregateFunction,
  MetricType,
  PeriodCalculationMode,
  PeriodOverPeriodType,
} from '@/module/dataset/dataset.types';
import { DSLTransformerV2 } from './dsl-transformer.v2';

const createTable = (name: string, fieldNames: string[]) => ({
  name,
  alias: name,
  fields: fieldNames.map((fieldName) => ({ name: fieldName, type: 'string' })),
  getField: jest.fn((fieldName: string) =>
    fieldNames.includes(fieldName)
      ? { name: fieldName, type: 'string' }
      : null,
  ),
  withAlias: jest.fn((alias: string) => {
    const next = createTable(name, fieldNames);
    next.alias = alias;
    return next;
  }),
});

const createTables = () => [
  createTable('orders', ['id', 'customer_id', 'product_id', 'amount', 'order_date', 'status']),
  createTable('customers', ['id', 'name']),
  createTable('products', ['id', 'name']),
];

const createDataset = (overrides: Record<string, unknown> = {}): DatasetResponse =>
  ({
    id: 1,
    name: '分支覆盖数据集',
    description: '用于补充分支覆盖率',
    type: 'semantic',
    status: 'active',
    mainTableId: 1,
    datasource: { id: 1, name: '数据源', type: 'mysql' },
    mainTable: { id: 1, tableName: 'orders', datasetName: 'Orders' },
    tables: [
      {
        id: 1,
        datasourceTableId: 1,
        tableName: 'orders',
        datasetName: 'Orders',
      },
      {
        id: 2,
        datasourceTableId: 2,
        tableName: 'customers',
        datasetName: 'Customers',
      },
      {
        id: 3,
        datasourceTableId: 3,
        tableName: 'products',
        datasetName: 'Products',
      },
    ],
    fields: [
      { id: 1, tableId: 1, name: 'id', businessName: '订单ID', type: 'number', datasourceColumnId: 1 },
      { id: 2, tableId: 1, name: 'customer_id', businessName: '客户ID', type: 'number', datasourceColumnId: 2 },
      { id: 3, tableId: 1, name: 'product_id', businessName: '商品ID', type: 'number', datasourceColumnId: 3 },
      { id: 4, tableId: 1, name: 'amount', businessName: '金额', type: 'number', datasourceColumnId: 4 },
      { id: 5, tableId: 1, name: 'order_date', businessName: '下单时间', type: 'date', datasourceColumnId: 5 },
      { id: 6, tableId: 1, name: 'status', businessName: '状态', type: 'string', datasourceColumnId: 6 },
      { id: 7, tableId: 2, name: 'id', businessName: '客户ID', type: 'number', datasourceColumnId: 7 },
      { id: 8, tableId: 2, name: 'name', businessName: '客户名称', type: 'string', datasourceColumnId: 8 },
      { id: 9, tableId: 3, name: 'id', businessName: '商品ID', type: 'number', datasourceColumnId: 9 },
      { id: 10, tableId: 3, name: 'name', businessName: '商品名称', type: 'string', datasourceColumnId: 10 },
    ],
    metrics: [
      {
        id: 1,
        name: 'total_amount',
        businessName: '总金额',
        metricType: MetricType.AGGREGATE,
        aggregateFunction: MetricAggregateFunction.SUM,
        dataSourceColumnId: 4,
        timeFieldId: 5,
      },
      {
        id: 2,
        name: 'customer_count',
        businessName: '客户数',
        metricType: MetricType.AGGREGATE,
        aggregateFunction: MetricAggregateFunction.COUNT,
        dataSourceColumnId: 7,
      },
      {
        id: 3,
        name: 'row_metric',
        businessName: '行级指标',
        metricType: MetricType.ROW_LEVEL,
        leftOperand: 1,
        rightOperand: 2,
        rowOperator: '+',
      },
      {
        id: 4,
        name: 'post_metric',
        businessName: '后聚合指标',
        metricType: MetricType.POST_AGGREGATE,
        sourceMetricId: 1,
        aggregateFunction: MetricAggregateFunction.SUM,
      },
      {
        id: 5,
        name: 'arith_numeric',
        businessName: '算术常量',
        metricType: MetricType.ARITHMETIC,
        leftMetricId: 1,
        arithmeticOperator: '+',
        rightMetricOperand: 2,
      },
      {
        id: 6,
        name: 'arith_metric',
        businessName: '算术引用',
        metricType: MetricType.ARITHMETIC,
        leftMetricId: 1,
        arithmeticOperator: '-',
        rightMetricOperand: 2,
        rightMetricOperandFieldName: 'customer_count',
      },
      {
        id: 7,
        name: 'expr_metric',
        businessName: '表达式指标',
        metricType: MetricType.ARITHMETIC,
        expression: '#F1 + #M1',
      },
      {
        id: 8,
        name: 'case_eq',
        businessName: '条件等于',
        metricType: MetricType.AGGREGATE,
        aggregateFunction: MetricAggregateFunction.SUM,
        dataSourceColumnId: 4,
        aggregateCondition: { caseCondition: "status = 'paid'" },
      },
      {
        id: 9,
        name: 'case_neq',
        businessName: '条件不等于',
        metricType: MetricType.AGGREGATE,
        aggregateFunction: MetricAggregateFunction.SUM,
        dataSourceColumnId: 4,
        aggregateCondition: { caseCondition: "status != 'paid'" },
      },
      {
        id: 10,
        name: 'case_gt',
        businessName: '条件大于',
        metricType: MetricType.AGGREGATE,
        aggregateFunction: MetricAggregateFunction.SUM,
        dataSourceColumnId: 4,
        aggregateCondition: { caseCondition: 'amount > 100' },
      },
      {
        id: 11,
        name: 'case_gte',
        businessName: '条件大于等于',
        metricType: MetricType.AGGREGATE,
        aggregateFunction: MetricAggregateFunction.SUM,
        dataSourceColumnId: 4,
        aggregateCondition: { caseCondition: 'amount >= 100' },
      },
      {
        id: 12,
        name: 'case_lt',
        businessName: '条件小于',
        metricType: MetricType.AGGREGATE,
        aggregateFunction: MetricAggregateFunction.SUM,
        dataSourceColumnId: 4,
        aggregateCondition: { caseCondition: 'amount < 100' },
      },
      {
        id: 13,
        name: 'case_lte',
        businessName: '条件小于等于',
        metricType: MetricType.AGGREGATE,
        aggregateFunction: MetricAggregateFunction.SUM,
        dataSourceColumnId: 4,
        aggregateCondition: { caseCondition: 'amount <= 100' },
      },
      {
        id: 14,
        name: 'case_default',
        businessName: '条件默认分支',
        metricType: MetricType.AGGREGATE,
        aggregateFunction: MetricAggregateFunction.SUM,
        dataSourceColumnId: 4,
        aggregateCondition: { caseCondition: 'not-match' },
      },
      {
        id: 15,
        name: 'period_metric',
        businessName: '同期指标',
        metricType: MetricType.AGGREGATE,
        aggregateFunction: MetricAggregateFunction.SUM,
        dataSourceColumnId: 4,
        timeFieldId: 5,
      },
      {
        id: 16,
        name: 'period_base',
        businessName: '周期基准',
        metricType: MetricType.AGGREGATE,
        aggregateFunction: MetricAggregateFunction.SUM,
        dataSourceColumnId: 4,
        timeFieldId: 5,
      },
      {
        id: 17,
        name: 'period_expr',
        businessName: '周期表达式基准',
        metricType: MetricType.ARITHMETIC,
        expression: 'MOM(#M1, #F5)',
      },
    ],
    joins: [
      {
        id: 1,
        joinType: JoinType.LEFT,
        leftTableId: 1,
        leftField: '2',
        rightTableId: 2,
        rightField: '7',
      },
      {
        id: 2,
        joinType: JoinType.RIGHT,
        leftTableId: 1,
        leftField: '3',
        rightTableId: 3,
        rightField: '9',
      },
      {
        id: 3,
        joinType: JoinType.INNER,
        leftTableId: 2,
        leftField: '8',
        rightTableId: 3,
        rightField: '10',
      },
    ],
    ...overrides,
  }) as DatasetResponse;

describe('DSLTransformerV2 额外分支覆盖', () => {
  let tables: any[];
  let dataset: DatasetResponse;

  beforeEach(() => {
    tables = createTables();
    dataset = createDataset();
  });

  it('异常流程：DSL 为空以及 topN 校验失败时会直接报错', () => {
    expect(() =>
      DSLTransformerV2.transform(null as any, dataset, tables),
    ).toThrow('DSL不能为空');
    expect(() =>
      DSLTransformerV2.transform(
        { datasetId: 1, topN: 0, orderBy: [{ fieldId: 1, dir: 'asc' }] } as any,
        dataset,
        tables,
      ),
    ).toThrow('topN 必须是大于 0 的整数');
    expect(() =>
      DSLTransformerV2.transform(
        { datasetId: 1, topN: 2, orderBy: [], limit: 2 } as any,
        dataset,
        tables,
      ),
    ).toThrow('topN 需要配合 orderBy 使用');
    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          topN: 2,
          orderBy: [{ fieldId: 1, dir: 'asc' }],
          limit: 3,
        } as any,
        dataset,
        tables,
      ),
    ).toThrow('topN 与 limit 不能同时指定不同的值');
    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          topN: 2,
          orderBy: [{ fieldId: 1, dir: 'asc' }],
          offset: 1,
        } as any,
        dataset,
        tables,
      ),
    ).toThrow('topN 不支持与 offset 同时使用');
  });

  it('正常流程：聚合条件可以解析多种 caseCondition 分支', () => {
    const result = DSLTransformerV2.transform(
      {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [
          { id: 1 },
          { id: 8 },
          { id: 9 },
          { id: 10 },
          { id: 11 },
          { id: 12 },
          { id: 13 },
          { id: 14 },
        ],
      } as any,
      dataset,
      tables,
    );

    expect(result.metrics).toHaveLength(8);
  });

  it('正常流程：多种指标类型可以一起构建', () => {
    const result = DSLTransformerV2.transform(
      {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [
          { id: 3 },
          { id: 4 },
          { id: 5 },
          { id: 6 },
        ],
      } as any,
      dataset,
      tables,
    );

    expect(result.metrics).toHaveLength(4);
    expect(result.metrics[0]).toBeInstanceOf(BinaryExpr);
    expect(result.metrics[1]).toBeInstanceOf(AggExpr);
    expect(result.metrics[2]).toBeInstanceOf(BinaryExpr);
    expect(result.metrics[3]).toBeInstanceOf(BinaryExpr);
  });

  it('正常流程：LEFT、RIGHT、INNER 三种关联方向都能建立', () => {
    const result = DSLTransformerV2.transform(
      {
        datasetId: 1,
        tableId: 1,
        dimensions: [8, 10],
        metrics: [{ id: 1 }],
      } as any,
      dataset,
      tables,
    );

    expect(result.joins).toHaveLength(2);
  });

  it('异常流程：不可达表会报错', () => {
    const noJoinDataset = createDataset({ joins: [] });

    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [8],
          metrics: [{ id: 1 }],
        } as any,
        noJoinDataset,
        tables,
      ),
    ).toThrow(/无法通过数据集 join 到达表/);
  });

  it('异常流程：字段、表和指标缺失都会报错', () => {
    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [999],
          metrics: [{ id: 1 }],
        } as any,
        dataset,
        tables,
      ),
    ).toThrow('找不到字段: 999');

    const brokenTableDataset = createDataset({
      fields: [
        {
          id: 100,
          tableId: 999,
          name: 'ghost',
          businessName: '幽灵字段',
          type: 'string',
          datasourceColumnId: 100,
        },
      ],
      metrics: [],
    });

    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [100],
          metrics: [],
        } as any,
        brokenTableDataset,
        tables,
      ),
    ).toThrow('找不到字段所属表: 999');

    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [1],
          metrics: [{ id: 999 }],
        } as any,
        dataset,
        tables,
      ),
    ).toThrow('找不到指标: 999');
  });

  it('正常流程：排序别名、指标、临时指标和字段都可以解析', () => {
    const result = DSLTransformerV2.transform(
      {
        datasetId: 1,
        tableId: 1,
        dimensions: [{ fieldId: 1, alias: 'order_id_alias' }],
        metrics: [{ id: 1 }],
        tempMetrics: [
          {
            id: 'pop',
            alias: 'pop_7day',
            baseMetricId: 1,
            timeFieldId: 5,
            periodType: PeriodOverPeriodType.MONTH_OVER_MONTH,
            calculationMode: PeriodCalculationMode.PERCENTAGE,
          },
        ],
        filters: [{ fieldId: 5, op: 'recent_days', value: 7 }],
        orderBy: [
          { alias: 'order_id_alias', dir: 'asc' },
          { field: 'order_id_alias', dir: 'desc' },
          { metricId: 1, dir: 'asc' },
          { tempMetricId: 'pop', dir: 'desc' },
          { fieldId: 1, dir: 'asc' },
        ],
      } as any,
      dataset,
      tables,
    );

    expect(result.orderBy).toEqual([
      { expr: 'order_id_alias', dir: 'asc' },
      { expr: 'order_id_alias', dir: 'desc' },
      { expr: 'total_amount', dir: 'asc' },
      { expr: 'pop_7day', dir: 'desc' },
      { expr: 'order_id_alias', dir: 'asc' },
    ]);
  });

  it('异常流程：排序方向、别名和字段重复都会报错', () => {
    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [{ fieldId: 1, alias: 'order_id_alias' }],
          metrics: [{ id: 1 }],
          orderBy: [{ fieldId: 1, dir: 'up' as any }],
        } as any,
        dataset,
        tables,
      ),
    ).toThrow('不支持的排序方向: up');

    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [{ fieldId: 1, alias: 'order_id_alias' }],
          metrics: [{ id: 1 }],
          orderBy: [{ alias: 'missing', dir: 'asc' }],
        } as any,
        dataset,
        tables,
      ),
    ).toThrow(/未选中的 alias/);

    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [
            { fieldId: 1, alias: 'order_id_alias' },
            { fieldId: 1, alias: 'order_id_alias_2' },
          ],
          metrics: [{ id: 1 }],
          orderBy: [{ fieldId: 1, dir: 'asc' }],
        } as any,
        dataset,
        tables,
      ),
    ).toThrow(/多个维度/);
  });

  it('正常流程：过滤条件可以覆盖常见分支', () => {
    const result = DSLTransformerV2.transform(
      {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [{ id: 1 }],
        filters: [
          { fieldId: 5, op: 'recent_days', value: 7 },
          { fieldId: 5, op: 'recent_weeks', value: 2 },
          { fieldId: 5, op: 'recent_months', value: 3 },
          { fieldId: 6, op: 'in', value: ['paid', 'shipped'] },
          { fieldId: 6, op: 'in', value: 'paid' },
          { fieldId: 6, op: 'not_in', value: 'cancelled' },
          { fieldId: 4, op: 'between', value: { low: 10, high: 20 } },
          { fieldId: 4, op: 'not_between', value: { low: 30, high: 40 } },
          { fieldId: 6, op: 'like', value: '%p%' },
          { fieldId: 6, op: 'not_like', value: '%x%' },
          { fieldId: 6, op: 'is_null' },
          { fieldId: 6, op: 'is_not_null' },
          { fieldId: 6, op: '=', value: 'status = 1', raw: true },
          { fieldId: 4, op: '!=', value: 1 },
          { fieldId: 4, op: '>', value: 1 },
          { fieldId: 4, op: '<=', value: 100 },
        ],
      } as any,
      dataset,
      tables,
    );

    expect(result.filters).toHaveLength(16);
  });

  it('异常流程：过滤条件的非法值和未知操作符会报错', () => {
    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [1],
          metrics: [{ id: 1 }],
          filters: [{ fieldId: 4, op: 'between', value: { low: 10 } }],
        } as any,
        dataset,
        tables,
      ),
    ).toThrow('BETWEEN 操作符需要 { low, high } 格式的 value');

    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [1],
          metrics: [{ id: 1 }],
          filters: [{ fieldId: 4, op: 'not_between', value: { low: 10 } }],
        } as any,
        dataset,
        tables,
      ),
    ).toThrow('NOT BETWEEN 操作符需要 { low, high } 格式的 value');

    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [1],
          metrics: [{ id: 1 }],
          filters: [{ fieldId: 4, op: 'unknown_op' }],
        } as any,
        dataset,
        tables,
      ),
    ).toThrow('不支持的操作符: unknown_op');
  });

  it('正常流程：临时周期指标可以覆盖不同周期类型', () => {
    const result = DSLTransformerV2.transform(
      {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [{ id: 1 }],
        filters: [{ fieldId: 5, op: 'recent_days', value: 7 }],
        tempMetrics: [
          {
            id: 'd',
            alias: 'd',
            baseMetricId: 1,
            timeFieldId: 5,
            periodType: PeriodOverPeriodType.DAY_OVER_DAY,
          },
          {
            id: 'w',
            alias: 'w',
            baseMetricId: 1,
            timeFieldId: 5,
            periodType: PeriodOverPeriodType.WEEK_OVER_WEEK,
          },
          {
            id: 'q',
            alias: 'q',
            baseMetricId: 1,
            timeFieldId: 5,
            periodType: PeriodOverPeriodType.QUARTER_OVER_QUARTER,
          },
          {
            id: 'y',
            alias: 'y',
            baseMetricId: 1,
            timeFieldId: 5,
            periodType: PeriodOverPeriodType.YEAR_OVER_YEAR,
            calculationMode: PeriodCalculationMode.ABSOLUTE,
          },
        ],
      } as any,
      dataset,
      tables,
    );

    expect(result.metrics).toHaveLength(5);
    expect(result.metrics[1]).toBeInstanceOf(PeriodComparisonExpr);
  });

  it('异常流程：临时周期指标的配置错误会报错', () => {
    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [1],
          metrics: [{ id: 1 }],
          tempMetrics: [
            {
              id: 'bad-type',
              alias: 'bad-type',
              type: 'other' as any,
              baseMetricId: 1,
              timeFieldId: 5,
            },
          ],
          filters: [{ fieldId: 5, op: 'recent_days', value: 7 }],
        } as any,
        dataset,
        tables,
      ),
    ).toThrow('不支持的临时指标类型: other');

    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [1],
          metrics: [{ id: 1 }],
          tempMetrics: [
            {
              id: 'no-filter',
              alias: 'no-filter',
              baseMetricId: 1,
              timeFieldId: 5,
            },
          ],
        } as any,
        dataset,
        tables,
      ),
    ).toThrow(/匹配时间过滤器/);

    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [1],
          metrics: [{ id: 1 }],
          filters: [{ fieldId: 5, op: 'recent_days', value: 7 }],
          tempMetrics: [
            {
              id: 'both',
              alias: 'both',
              baseMetricId: 1,
              timeFieldId: 5,
              calculationMode: PeriodCalculationMode.BOTH,
            },
          ],
        } as any,
        dataset,
        tables,
      ),
    ).toThrow(/calculationMode=both/);

    const periodBaseDataset = createDataset({
      metrics: [
        {
          id: 1,
          name: 'total_amount',
          businessName: '总金额',
          metricType: MetricType.AGGREGATE,
          aggregateFunction: MetricAggregateFunction.SUM,
          dataSourceColumnId: 4,
          timeFieldId: 5,
        },
        {
          id: 17,
          name: 'period_expr',
          businessName: '周期表达式基准',
          metricType: MetricType.ARITHMETIC,
          expression: 'MOM(#M1, #F5)',
        },
      ],
    });

    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [1],
          metrics: [{ id: 17 }],
          filters: [{ fieldId: 5, op: 'recent_days', value: 7 }],
          tempMetrics: [
            {
              id: 'period-base',
              alias: 'period-base',
              baseMetricId: 17,
              timeFieldId: 5,
            },
          ],
        } as any,
        periodBaseDataset,
        tables,
      ),
    ).toThrow(/不能使用周期指标作为其基础指标/);
  });

  it('正常流程：表达式维度和表达式指标可以解析引用', () => {
    const result = DSLTransformerV2.transform(
      {
        datasetId: 1,
        tableId: 1,
        dimensions: [
          {
            derivedKind: 'expression',
            expression: '#F1 + 1',
            alias: 'expr_dim',
          },
        ],
        metrics: [{ id: 7 }],
        filters: [{ fieldId: 5, op: 'recent_days', value: 7 }],
      } as any,
      dataset,
      tables,
    );

    expect(result.dimensions[0]).toBeInstanceOf(BinaryExpr);
    expect(result.metrics[0]).toBeInstanceOf(BinaryExpr);
  });

  it('异常流程：表达式中的字段或指标引用缺失时会报错', () => {
    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [
            {
              derivedKind: 'expression',
              expression: '#F999 + 1',
              alias: 'bad_field',
            },
          ],
          metrics: [{ id: 1 }],
          filters: [{ fieldId: 5, op: 'recent_days', value: 7 }],
        } as any,
        dataset,
        tables,
      ),
    ).toThrow('找不到字段: 999');

    const brokenExpressionDataset = createDataset({
      metrics: [
        {
          id: 1,
          name: 'total_amount',
          businessName: '总金额',
          metricType: MetricType.AGGREGATE,
          aggregateFunction: MetricAggregateFunction.SUM,
          dataSourceColumnId: 4,
        },
        {
          id: 18,
          name: 'bad_expr',
          businessName: '坏表达式',
          metricType: MetricType.ARITHMETIC,
          expression: '#M999 + #F1',
        },
      ],
    });

    expect(() =>
      DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [1],
          metrics: [{ id: 18 }],
          filters: [{ fieldId: 5, op: 'recent_days', value: 7 }],
        } as any,
        brokenExpressionDataset,
        tables,
      ),
    ).toThrow('找不到指标: 999');
  });
});
