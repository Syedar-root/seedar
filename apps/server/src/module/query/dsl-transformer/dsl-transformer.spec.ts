import { DSLTransformerV2 } from './dsl-transformer.v2';
import { DSLTransformer } from './dsl-transformer';
import {
  DatasetResponse,
  DatasetTableResponse,
  DatasetFieldResponse,
  DatasetMetricResponse,
  DatasetJoinResponse,
  MetricType,
  MetricAggregateFunction,
  JoinType,
  PeriodOverPeriodType,
  PeriodCalculationMode,
} from '../../dataset/dataset.types';
import {
  BinaryExpr,
  InExpr,
  BetweenExpr,
  LikeExpr,
  IsNullExpr,
  PeriodComparisonExpr,
  PeriodOffsetType,
  ComparisonMode,
  AggExpr,
  FieldRefExpr,
  CallExpr,
  ConditionalExpr,
  ComparisonExpr,
  LiteralExpr,
} from '@metric-engine/core';

describe('动态关联选择', () => {
  let mockDatasetInfo: DatasetResponse;
  let mockTables: any[];

  beforeEach(() => {
    const createMockTable = (name: string, fieldNames: string[]) => {
      const table = {
        name,
        alias: name,
        fields: fieldNames.map((fname) => ({ name: fname, type: 'string' })),
        getField: jest.fn((fname: string) => {
          const field = fieldNames.includes(fname)
            ? { name: fname, type: 'string' }
            : null;
          return field;
        }),
        withAlias: jest.fn((alias: string) => {
          const newTable = createMockTable(name, fieldNames);
          newTable.alias = alias;
          return newTable;
        }),
      };
      return table;
    };

    mockTables = [
      createMockTable('orders', ['id', 'customer_id', 'product_id', 'amount']),
      createMockTable('customers', ['id', 'name']),
      createMockTable('products', ['id', 'name']),
    ];

    mockDatasetInfo = {
      id: 1,
      name: 'Test Dataset',
      description: 'Test dataset for join selection',
      type: 'semantic' as any,
      status: 'active' as any,
      mainTableId: 1,
      datasource: {
        id: 1,
        name: 'Test Datasource',
        type: 'mysql',
      },
      mainTable: {
        id: 1,
        tableName: 'orders',
        datasetName: 'Orders',
      },
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
      ] as DatasetTableResponse[],
      fields: [
        {
          id: 1,
          tableId: 1,
          name: 'id',
          businessName: 'Order ID',
          type: 'number' as any,
          datasourceColumnId: 1,
        },
        {
          id: 2,
          tableId: 1,
          name: 'customer_id',
          businessName: 'Customer ID',
          type: 'number' as any,
          datasourceColumnId: 2,
        },
        {
          id: 3,
          tableId: 1,
          name: 'product_id',
          businessName: 'Product ID',
          type: 'number' as any,
          datasourceColumnId: 3,
        },
        {
          id: 4,
          tableId: 1,
          name: 'amount',
          businessName: 'Amount',
          type: 'number' as any,
          datasourceColumnId: 4,
        },
        {
          id: 5,
          tableId: 2,
          name: 'id',
          businessName: 'Customer ID',
          type: 'number' as any,
          datasourceColumnId: 5,
        },
        {
          id: 6,
          tableId: 2,
          name: 'name',
          businessName: 'Customer Name',
          type: 'string' as any,
          datasourceColumnId: 6,
        },
        {
          id: 7,
          tableId: 3,
          name: 'id',
          businessName: 'Product ID',
          type: 'number' as any,
          datasourceColumnId: 7,
        },
        {
          id: 8,
          tableId: 3,
          name: 'name',
          businessName: 'Product Name',
          type: 'string' as any,
          datasourceColumnId: 8,
        },
      ] as DatasetFieldResponse[],
      metrics: [
        {
          id: 1,
          name: 'total_amount',
          businessName: 'Total Amount',
          metricType: MetricType.AGGREGATE,
          aggregateFunction: MetricAggregateFunction.SUM,
          dataSourceColumnId: 4,
        },
        {
          id: 2,
          name: 'customer_count',
          businessName: 'Customer Count',
          metricType: MetricType.AGGREGATE,
          aggregateFunction: MetricAggregateFunction.COUNT,
          dataSourceColumnId: 5,
        },
      ] as DatasetMetricResponse[],
      joins: [
        {
          id: 1,
          joinType: JoinType.INNER,
          leftTableId: 1,
          leftField: '2',
          rightTableId: 2,
          rightField: '5',
        },
        {
          id: 2,
          joinType: JoinType.INNER,
          leftTableId: 1,
          leftField: '3',
          rightTableId: 3,
          rightField: '7',
        },
      ] as DatasetJoinResponse[],
    };
  });

  describe('V2 转换器', () => {
    it('正常流程：单表查询不生成关联', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [{ id: 1 }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.joins).toBeDefined();
      expect(result.joins.length).toBe(0);
    });

    it('正常流程：通过维度触发多表关联', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [6],
        metrics: [{ id: 1 }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.joins).toBeDefined();
      expect(result.joins.length).toBe(1);
      expect(result.joins[0].table).toBe('customers');
    });

    it('正常流程：省略 tableId 时按关联方向推断根表', () => {
      const dsl = {
        datasetId: 1,
        dimensions: [6],
        metrics: [{ id: 1 }],
      };

      const datasetWithLeftJoin: DatasetResponse = {
        ...mockDatasetInfo,
        joins: [
          {
            ...mockDatasetInfo.joins![0],
            joinType: JoinType.LEFT,
          },
        ],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        datasetWithLeftJoin,
        mockTables,
      );

      expect(result.from.table).toBe('orders');
      expect(result.from.alias).toBe('t1');
      expect(result.joins).toHaveLength(1);
      expect(result.joins[0].table).toBe('customers');
      expect(result.joins[0].type).toBe(JoinType.LEFT);
    });

    it('正常流程：根表推断冲突时回退 mainTableId', () => {
      const dsl = {
        datasetId: 1,
        dimensions: [6],
        metrics: [{ id: 1 }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.from.table).toBe('orders');
      expect(result.from.alias).toBe('t1');
    });

    it('正常流程：通过指标触发多表关联', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [{ id: 2 }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.joins).toBeDefined();
      expect(result.joins.length).toBe(1);
      expect(result.joins[0].table).toBe('customers');
    });

    it('正常流程：多表依赖时生成多条关联', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [6, 8],
        metrics: [{ id: 1 }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.joins).toBeDefined();
      expect(result.joins.length).toBe(2);
      expect(result.joins.map((j) => j.table)).toContain('customers');
      expect(result.joins.map((j) => j.table)).toContain('products');
    });

    it('正常流程：过滤条件触发表关联生成', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [{ id: 1 }],
        filters: [{ fieldId: 6, op: '=', value: 'John' }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.joins).toBeDefined();
      expect(result.joins.length).toBe(1);
      expect(result.joins[0].table).toBe('customers');
    });

    it('正常流程：反向遍历关联时正确分配别名', () => {
      const dsl = {
        datasetId: 1,
        tableId: 2,
        dimensions: [6],
        metrics: [{ id: 1 }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.from.alias).toBe('t1');
      expect(result.joins).toHaveLength(1);
      expect(result.joins[0].table).toBe('orders');
      expect(result.joins[0].alias).toBe('t2');

      const joinExpr = result.joins[0].on as ComparisonExpr;
      expect(joinExpr).toBeInstanceOf(ComparisonExpr);
      expect(joinExpr.left).toBeInstanceOf(FieldRefExpr);
      expect(joinExpr.right).toBeInstanceOf(FieldRefExpr);
      expect((joinExpr.left as FieldRefExpr).getQualifiedName()).toBe('t1.id');
      expect((joinExpr.right as FieldRefExpr).getQualifiedName()).toBe(
        't2.customer_id',
      );
    });

    it('正常流程：对象维度别名保持向后兼容', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [{ fieldId: 1, alias: 'order_id_alias' }],
        metrics: [{ id: 1 }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.dimensions).toHaveLength(1);
      const [dimensionExpr] = result.dimensions as FieldRefExpr[];
      expect(dimensionExpr).toBeInstanceOf(FieldRefExpr);
      expect(dimensionExpr.meta?.alias).toBe('order_id_alias');
    });

    it('正常流程：time_grain 衍生维度转换为 CallExpr', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [
          {
            derivedKind: 'time_grain' as const,
            fieldId: 1,
            grain: 'month' as const,
            alias: 'month_bucket',
          },
        ],
        metrics: [{ id: 1 }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      const [dimensionExpr] = result.dimensions as CallExpr[];
      expect(dimensionExpr).toBeInstanceOf(CallExpr);
      expect(dimensionExpr.functionName).toBe('TIME_GRAIN');
      expect(dimensionExpr.args[0]).toBeInstanceOf(FieldRefExpr);
      expect(dimensionExpr.args[1]).toBeInstanceOf(LiteralExpr);
      expect((dimensionExpr.args[1] as LiteralExpr).value).toBe('month');
      expect(dimensionExpr.meta?.alias).toBe('month_bucket');
      expect(dimensionExpr.meta?.businessName).toBe('month_bucket');
    });

    it('正常流程：为维度与指标生成排序表达式', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [{ id: 1 }],
        orderBy: [
          { fieldId: 1, dir: 'asc' as const },
          { metricId: 1, dir: 'desc' as const },
        ],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.orderBy).toEqual([
        { expr: 't1.id', dir: 'asc' },
        { expr: 'total_amount', dir: 'desc' },
      ]);
    });

    it('异常流程：同字段映射多个维度时必须提供 alias', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [
          1,
          {
            derivedKind: 'time_grain' as const,
            fieldId: 1,
            grain: 'month' as const,
            alias: 'month_bucket',
          },
        ],
        metrics: [{ id: 1 }],
        orderBy: [{ fieldId: 1, dir: 'asc' as const }],
      };

      expect(() =>
        DSLTransformerV2.transform(dsl, mockDatasetInfo, mockTables),
      ).toThrow(/多个维度.*alias/i);
    });

    it('正常流程：衍生维度支持 alias 排序', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [
          {
            derivedKind: 'time_grain' as const,
            fieldId: 1,
            grain: 'month' as const,
            alias: 'month_bucket',
          },
        ],
        metrics: [{ id: 1 }],
        orderBy: [{ alias: 'month_bucket', dir: 'desc' as const }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.orderBy).toEqual([{ expr: 'month_bucket', dir: 'desc' }]);
    });

    it('正常流程：存在排序时将 topN 映射为 limit', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [{ id: 1 }],
        orderBy: [{ metricId: 1, dir: 'desc' as const }],
        topN: 5,
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.orderBy).toEqual([{ expr: 'total_amount', dir: 'desc' }]);
      expect(result.limit).toBe(5);
    });

    it('异常流程：缺少 orderBy 时拒绝 topN', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [{ id: 1 }],
        topN: 5,
      };

      expect(() =>
        DSLTransformerV2.transform(dsl, mockDatasetInfo, mockTables),
      ).toThrow(/topN.*orderBy/i);
    });

    it('异常流程：topN 与 limit 冲突时报错', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [{ id: 1 }],
        orderBy: [{ metricId: 1, dir: 'desc' as const }],
        topN: 5,
        limit: 10,
      };

      expect(() =>
        DSLTransformerV2.transform(dsl, mockDatasetInfo, mockTables),
      ).toThrow(/topN.*limit/i);
    });

    it('异常流程：topN 不允许与 offset 同时使用', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [{ id: 1 }],
        orderBy: [{ metricId: 1, dir: 'desc' as const }],
        topN: 5,
        offset: 1,
      };

      expect(() =>
        DSLTransformerV2.transform(dsl, mockDatasetInfo, mockTables),
      ).toThrow(/topN.*offset/i);
    });

    it('正常流程：bucket 衍生维度构建条件链', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [
          {
            derivedKind: 'bucket' as const,
            fieldId: 4,
            ranges: [
              { lt: 20, label: '差' },
              { lt: 50, label: '一般' },
            ],
            defaultLabel: '好',
            alias: 'quality_bucket',
          },
        ],
        metrics: [{ id: 1 }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      const [dimensionExpr] = result.dimensions as ConditionalExpr[];
      expect(dimensionExpr).toBeInstanceOf(ConditionalExpr);
      expect(dimensionExpr.meta?.alias).toBe('quality_bucket');
      expect(dimensionExpr.condition).toBeInstanceOf(ComparisonExpr);
      expect((dimensionExpr.condition as ComparisonExpr).operator).toBe('<');
    });

    it('正常流程：mapping 衍生维度按首个命中构建条件链', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [
          {
            derivedKind: 'mapping' as const,
            fieldId: 4,
            rules: [
              { in: [100, 200], label: 'high' },
              { in: [50], label: 'mid' },
            ],
            defaultLabel: 'low',
            alias: 'amount_level',
          },
        ],
        metrics: [{ id: 1 }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      const [dimensionExpr] = result.dimensions as ConditionalExpr[];
      expect(dimensionExpr).toBeInstanceOf(ConditionalExpr);
      expect(dimensionExpr.meta?.alias).toBe('amount_level');
      expect((dimensionExpr.condition as ComparisonExpr).operator).toBe('=');
    });

    it('正常流程：expression 衍生维度保留 alias 元信息', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [
          {
            derivedKind: 'expression' as const,
            expression: '#F1',
            alias: 'order_id_expr',
          },
        ],
        metrics: [{ id: 1 }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      const [dimensionExpr] = result.dimensions as FieldRefExpr[];
      expect(dimensionExpr).toBeInstanceOf(FieldRefExpr);
      expect(dimensionExpr.meta?.alias).toBe('order_id_expr');
      expect(dimensionExpr.meta?.businessName).toBe('order_id_expr');
    });

    it('正常流程：COUNT 比较表达式转换为条件计数语义', () => {
      const expressionMetric = {
        id: 3,
        name: 'yes_rate',
        businessName: 'Yes Rate',
        metricType: MetricType.ARITHMETIC,
        expression: "COUNT(#F9 = 'Yes') / #M2",
      } as DatasetMetricResponse;

      const datasetInfo = {
        ...mockDatasetInfo,
        fields: [
          ...(mockDatasetInfo.fields || []),
          {
            id: 9,
            tableId: 1,
            name: 'survey_answer',
            businessName: 'Survey Answer',
            type: 'string' as any,
            datasourceColumnId: 9,
          } as DatasetFieldResponse,
        ],
        metrics: [...(mockDatasetInfo.metrics || []), expressionMetric],
      } as DatasetResponse;

      const result = DSLTransformerV2.transform(
        {
          datasetId: 1,
          tableId: 1,
          dimensions: [1],
          metrics: [{ id: 3 }],
        },
        datasetInfo,
        mockTables,
      );

      const [metricExpr] = result.metrics as [BinaryExpr];
      expect(metricExpr).toBeInstanceOf(BinaryExpr);
      expect(metricExpr.operator).toBe('/');

      const numerator = metricExpr.left as AggExpr;
      expect(numerator).toBeInstanceOf(AggExpr);
      expect(numerator.functionName).toBe('COUNT');
      expect(numerator.arg).toBeInstanceOf(ConditionalExpr);

      const conditionalArg = numerator.arg as ConditionalExpr;
      expect(conditionalArg.condition).toBeInstanceOf(ComparisonExpr);
      expect((conditionalArg.condition as ComparisonExpr).operator).toBe('=');
      expect(conditionalArg.consequent).toEqual(new LiteralExpr(1));
      expect(conditionalArg.alternate).toEqual(new LiteralExpr(null));

      const denominator = metricExpr.right as AggExpr;
      expect(denominator).toBeInstanceOf(AggExpr);
      expect(denominator.functionName).toBe('COUNT');
    });

    it('正常流程：非主表衍生维度可收集关联', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [
          {
            derivedKind: 'time_grain' as const,
            fieldId: 6,
            grain: 'day' as const,
            alias: 'customer_day',
          },
        ],
        metrics: [{ id: 1 }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.joins).toHaveLength(1);
      expect(result.joins[0].table).toBe('customers');
    });

    it('异常流程：衍生维度缺少 alias 时拒绝', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [
          {
            derivedKind: 'time_grain' as const,
            fieldId: 1,
            grain: 'month' as const,
          },
        ],
        metrics: [{ id: 1 }],
      };

      expect(() =>
        DSLTransformerV2.transform(dsl as any, mockDatasetInfo, mockTables),
      ).toThrow(/alias/i);
    });

    it('异常流程：不支持的 derivedKind 报错', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [
          {
            derivedKind: 'unknown_kind',
            fieldId: 1,
            alias: 'invalid_kind',
          },
        ],
        metrics: [{ id: 1 }],
      };

      expect(() =>
        DSLTransformerV2.transform(dsl as any, mockDatasetInfo, mockTables),
      ).toThrow(/derivedKind/i);
    });

    it('异常流程：expression 衍生维度禁止引用 #M', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [
          {
            derivedKind: 'expression' as const,
            expression: '#M1 + #F1',
            alias: 'invalid_expression',
          },
        ],
        metrics: [{ id: 1 }],
      };

      expect(() =>
        DSLTransformerV2.transform(dsl, mockDatasetInfo, mockTables),
      ).toThrow(/#M/i);
    });
  });

  describe('V1 转换器', () => {
    it('正常流程：单表查询不生成关联', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [{ id: 1 }],
      };

      const result = DSLTransformer.transform(dsl, mockDatasetInfo, mockTables);

      expect(result.joins).toBeDefined();
      expect(result.joins.length).toBe(0);
    });

    it('正常流程：通过维度触发多表关联', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [6],
        metrics: [{ id: 1 }],
      };

      const result = DSLTransformer.transform(dsl, mockDatasetInfo, mockTables);

      expect(result.joins).toBeDefined();
      expect(result.joins.length).toBe(1);
      expect(result.joins[0].rightTable.name).toBe('customers');
    });

    it('正常流程：通过指标触发多表关联', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [{ id: 2 }],
      };

      const result = DSLTransformer.transform(dsl, mockDatasetInfo, mockTables);

      expect(result.joins).toBeDefined();
      expect(result.joins.length).toBe(1);
      expect(result.joins[0].rightTable.name).toBe('customers');
    });

    it('正常流程：多表依赖时生成多条关联', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [6, 8],
        metrics: [{ id: 1 }],
      };

      const result = DSLTransformer.transform(dsl, mockDatasetInfo, mockTables);

      expect(result.joins).toBeDefined();
      expect(result.joins.length).toBe(2);
      expect(result.joins.map((j) => j.rightTable.name)).toContain('customers');
      expect(result.joins.map((j) => j.rightTable.name)).toContain('products');
    });

    it('正常流程：过滤条件触发表关联生成', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        metrics: [{ id: 1 }],
        filters: [{ fieldId: 6, op: '=', value: 'John' }],
      };

      const result = DSLTransformer.transform(dsl, mockDatasetInfo, mockTables);

      expect(result.joins).toBeDefined();
      expect(result.joins.length).toBe(1);
      expect(result.joins[0].rightTable.name).toBe('customers');
    });
  });
});

describe('同期对比表达式', () => {
  let mockDatasetInfo: DatasetResponse;
  let mockTables: any[];
  type TestDatasetMetricResponse = DatasetMetricResponse & {
    timeFieldId?: number;
  };
  type TempMetricDSL = {
    id: string;
    alias?: string;
    baseMetricId: number;
    timeFieldId?: number;
    periodType?: PeriodOverPeriodType;
    calculationMode?: PeriodCalculationMode;
  };
  let baseMetric: TestDatasetMetricResponse;
  const timeFieldId = 5;

  const createDsl = (
    overrides: Partial<{
      filters: Array<{ fieldId: number; op: string; value?: any }>;
      tempMetrics: TempMetricDSL[];
      tempMetricOverrides: Partial<TempMetricDSL>;
      orderBy: Array<{
        fieldId?: number;
        metricId?: number;
        tempMetricId?: string;
        alias?: string;
        dir?: 'asc' | 'desc';
      }>;
    }> = {},
  ) => {
    const { filters, tempMetrics, tempMetricOverrides, ...rest } = overrides;

    const defaultFilters = [
      { fieldId: timeFieldId, op: 'recent_days', value: 30 },
    ];
    const defaultTempMetric: TempMetricDSL = {
      id: 'temp-pop',
      alias: 'amount_mom',
      baseMetricId: baseMetric?.id ?? 0,
      timeFieldId,
      periodType: PeriodOverPeriodType.MONTH_OVER_MONTH,
      calculationMode: PeriodCalculationMode.PERCENTAGE,
    };

    return {
      datasetId: 1,
      tableId: 1,
      metrics: [],
      filters: filters ?? defaultFilters,
      tempMetrics: tempMetrics ?? [
        {
          ...defaultTempMetric,
          ...(tempMetricOverrides ?? {}),
        },
      ],
      ...rest,
    };
  };

  beforeEach(() => {
    const createMockTable = (name: string, fieldNames: string[]) => {
      const table = {
        name,
        alias: name,
        fields: fieldNames.map((fname) => ({ name: fname, type: 'string' })),
        getField: jest.fn((fname: string) => {
          const field = fieldNames.includes(fname)
            ? { name: fname, type: 'string' }
            : null;
          return field;
        }),
        withAlias: jest.fn((alias: string) => {
          const cloned = createMockTable(name, fieldNames);
          cloned.alias = alias;
          return cloned;
        }),
      };
      return table;
    };

    mockTables = [
      createMockTable('orders', ['id', 'order_date_id', 'amount']),
      createMockTable('order_dates', ['id', 'day']),
    ];

    baseMetric = {
      id: 1,
      name: 'total_amount',
      businessName: 'Total Amount',
      metricType: MetricType.AGGREGATE,
      aggregateFunction: MetricAggregateFunction.SUM,
      dataSourceColumnId: 3,
      timeFieldId,
      distinct: false,
    } as TestDatasetMetricResponse;

    mockDatasetInfo = {
      id: 1,
      name: 'Period Comparison Dataset',
      description: 'Dataset for period comparison tests',
      type: 'semantic' as any,
      status: 'active' as any,
      datasource: { id: 1, name: 'Main', type: 'mysql' },
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
          tableName: 'order_dates',
          datasetName: 'Order Dates',
        },
      ] as DatasetTableResponse[],
      fields: [
        {
          id: 1,
          tableId: 1,
          name: 'id',
          businessName: 'Order ID',
          type: 'number' as any,
          datasourceColumnId: 1,
          isPrimaryKey: true,
        } as DatasetFieldResponse,
        {
          id: 2,
          tableId: 1,
          name: 'order_date_id',
          businessName: 'Order Date ID',
          type: 'number' as any,
          datasourceColumnId: 2,
          isPrimaryKey: false,
        } as DatasetFieldResponse,
        {
          id: 3,
          tableId: 1,
          name: 'amount',
          businessName: 'Amount',
          type: 'number' as any,
          datasourceColumnId: 3,
          isPrimaryKey: false,
        } as DatasetFieldResponse,
        {
          id: 4,
          tableId: 2,
          name: 'id',
          businessName: 'Date ID',
          type: 'number' as any,
          datasourceColumnId: 4,
          isPrimaryKey: true,
        } as DatasetFieldResponse,
        {
          id: 5,
          tableId: 2,
          name: 'day',
          businessName: 'Day',
          type: 'date' as any,
          datasourceColumnId: 5,
          isPrimaryKey: false,
        } as DatasetFieldResponse,
      ],
      metrics: [baseMetric],
      joins: [
        {
          id: 1,
          joinType: JoinType.INNER,
          leftTableId: 1,
          leftField: '2',
          rightTableId: 2,
          rightField: '4',
        },
      ] as DatasetJoinResponse[],
    } as DatasetResponse;
  });

  it('正常流程：MOM 临时指标转换为同期对比表达式', () => {
    const result = DSLTransformerV2.transform(
      createDsl(),
      mockDatasetInfo,
      mockTables,
    );
    expect(result.metrics.length).toBe(1);
    const [expr] = result.metrics as PeriodComparisonExpr[];
    expect(expr).toBeInstanceOf(PeriodComparisonExpr);
    expect(expr.offsetType).toBe(PeriodOffsetType.MONTH_OVER_MONTH);
    expect(expr.comparisonMode).toBe(ComparisonMode.PERCENTAGE);
    expect(expr.timeField.fieldName).toBe('day');
    expect(expr.timeField.tableAlias).toBeDefined();
    expect(expr.baseMetric).toBeInstanceOf(AggExpr);
  });

  it('正常流程：收集指标与时间字段关联链路', () => {
    const result = DSLTransformerV2.transform(
      createDsl(),
      mockDatasetInfo,
      mockTables,
    );
    expect(result.joins.some((join) => join.table === 'order_dates')).toBe(
      true,
    );
  });

  it('正常流程：支持 absolute 计算模式覆盖', () => {
    const result = DSLTransformerV2.transform(
      createDsl({
        tempMetricOverrides: {
          calculationMode: PeriodCalculationMode.ABSOLUTE,
        },
      }),
      mockDatasetInfo,
      mockTables,
    );
    const [expr] = result.metrics as PeriodComparisonExpr[];
    expect(expr.comparisonMode).toBe(ComparisonMode.ABSOLUTE);
  });

  it('异常流程：calculationMode=both 时拒绝', () => {
    expect(() =>
      DSLTransformerV2.transform(
        createDsl({
          tempMetricOverrides: {
            calculationMode: PeriodCalculationMode.BOTH,
          },
        }),
        mockDatasetInfo,
        mockTables,
      ),
    ).toThrow(/calculationMode.*both/i);
  });

  it('异常流程：缺少匹配时间过滤条件时报错', () => {
    const dsl = createDsl({ filters: [{ fieldId: 3, op: '=', value: 100 }] });
    expect(() =>
      DSLTransformerV2.transform(dsl, mockDatasetInfo, mockTables),
    ).toThrow(/time\s*filter|时间过滤器/i);
  });

  it('正常流程：基于基础聚合构造同期对比指标', () => {
    const result = DSLTransformerV2.transform(
      createDsl(),
      mockDatasetInfo,
      mockTables,
    );
    const expr = result.metrics[0] as PeriodComparisonExpr;
    expect(expr.baseMetric).toBeInstanceOf(AggExpr);
    expect((expr.baseMetric as AggExpr).functionName).toBe('SUM');
    expect((expr.baseMetric as AggExpr).arg).toBeInstanceOf(FieldRefExpr);
  });

  it('正常流程：临时指标生成排序表达式', () => {
    const result = DSLTransformerV2.transform(
      createDsl({
        orderBy: [{ tempMetricId: 'temp-pop', dir: 'desc' }],
      }),
      mockDatasetInfo,
      mockTables,
    );

    expect(result.orderBy).toEqual([{ expr: 'amount_mom', dir: 'desc' }]);
  });

  it('异常流程：临时指标缺少有效 timeFieldId 报错', () => {
    baseMetric.timeFieldId = undefined;
    expect(() =>
      DSLTransformerV2.transform(
        createDsl({
          tempMetricOverrides: {
            timeFieldId: undefined,
          },
        }),
        mockDatasetInfo,
        mockTables,
      ),
    ).toThrow(/timeFieldId/i);
  });
});

describe('过滤表达式类型', () => {
  let mockDatasetInfo: DatasetResponse;
  let mockTables: any[];

  beforeEach(() => {
    const createMockTable = (name: string, fieldNames: string[]) => {
      const table = {
        name,
        alias: name,
        fields: fieldNames.map((fname) => ({ name: fname, type: 'string' })),
        getField: jest.fn((fname: string) => {
          const field = fieldNames.includes(fname)
            ? { name: fname, type: 'string' }
            : null;
          return field;
        }),
        withAlias: jest.fn((alias: string) => {
          const newTable = createMockTable(name, fieldNames);
          newTable.alias = alias;
          return newTable;
        }),
      };
      return table;
    };

    mockTables = [
      createMockTable('orders', ['id', 'status', 'amount', 'name']),
    ];

    mockDatasetInfo = {
      id: 1,
      name: 'Test Dataset',
      description: 'Test dataset for filter expressions',
      type: 'semantic' as any,
      status: 'active' as any,
      datasource: {
        id: 1,
        name: 'Test Datasource',
        type: 'mysql',
      },
      mainTable: {
        id: 1,
        tableName: 'orders',
        datasetName: 'Orders',
      },
      tables: [
        {
          id: 1,
          datasourceTableId: 1,
          tableName: 'orders',
          datasetName: 'Orders',
        },
      ] as DatasetTableResponse[],
      fields: [
        {
          id: 1,
          tableId: 1,
          name: 'id',
          businessName: 'Order ID',
          type: 'number' as any,
          datasourceColumnId: 1,
        },
        {
          id: 2,
          tableId: 1,
          name: 'status',
          businessName: 'Status',
          type: 'string' as any,
          datasourceColumnId: 2,
        },
        {
          id: 3,
          tableId: 1,
          name: 'amount',
          businessName: 'Amount',
          type: 'number' as any,
          datasourceColumnId: 3,
        },
        {
          id: 4,
          tableId: 1,
          name: 'name',
          businessName: 'Name',
          type: 'string' as any,
          datasourceColumnId: 4,
        },
      ] as DatasetFieldResponse[],
      metrics: [],
      joins: [],
    };
  });

  describe('IN 表达式', () => {
    it('正常流程：IN 过滤转换为 InExpr', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        filters: [{ fieldId: 2, op: 'in', value: ['paid', 'shipped'] }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.filters).toBeDefined();
      expect(result.filters.length).toBe(1);
      expect(result.filters[0]).toBeInstanceOf(InExpr);
      expect((result.filters[0] as InExpr).negated).toBe(false);
    });

    it('正常流程：NOT IN 过滤转换为否定 InExpr', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        filters: [{ fieldId: 2, op: 'not_in', value: ['cancelled'] }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.filters).toBeDefined();
      expect(result.filters[0]).toBeInstanceOf(InExpr);
      expect((result.filters[0] as InExpr).negated).toBe(true);
    });
  });

  describe('BETWEEN 表达式', () => {
    it('正常流程：BETWEEN 过滤转换为 BetweenExpr', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        filters: [
          { fieldId: 3, op: 'between', value: { low: 100, high: 1000 } },
        ],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.filters).toBeDefined();
      expect(result.filters[0]).toBeInstanceOf(BetweenExpr);
      expect((result.filters[0] as BetweenExpr).negated).toBe(false);
    });

    it('正常流程：NOT BETWEEN 过滤转换为否定 BetweenExpr', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        filters: [
          { fieldId: 3, op: 'not_between', value: { low: 100, high: 1000 } },
        ],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.filters).toBeDefined();
      expect(result.filters[0]).toBeInstanceOf(BetweenExpr);
      expect((result.filters[0] as BetweenExpr).negated).toBe(true);
    });
  });

  describe('LIKE 表达式', () => {
    it('正常流程：LIKE 过滤转换为 LikeExpr', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        filters: [{ fieldId: 4, op: 'like', value: '%张%' }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.filters).toBeDefined();
      expect(result.filters[0]).toBeInstanceOf(LikeExpr);
      expect((result.filters[0] as LikeExpr).negated).toBe(false);
    });

    it('正常流程：NOT LIKE 过滤转换为否定 LikeExpr', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        filters: [{ fieldId: 4, op: 'not_like', value: '%spam%' }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.filters).toBeDefined();
      expect(result.filters[0]).toBeInstanceOf(LikeExpr);
      expect((result.filters[0] as LikeExpr).negated).toBe(true);
    });
  });

  describe('IS NULL 表达式', () => {
    it('正常流程：IS NULL 过滤转换为 IsNullExpr', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        filters: [{ fieldId: 2, op: 'is_null' }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.filters).toBeDefined();
      expect(result.filters[0]).toBeInstanceOf(IsNullExpr);
      expect((result.filters[0] as IsNullExpr).negated).toBe(false);
    });

    it('正常流程：IS NOT NULL 过滤转换为否定 IsNullExpr', () => {
      const dsl = {
        datasetId: 1,
        tableId: 1,
        dimensions: [1],
        filters: [{ fieldId: 2, op: 'is_not_null' }],
      };

      const result = DSLTransformerV2.transform(
        dsl,
        mockDatasetInfo,
        mockTables,
      );

      expect(result.filters).toBeDefined();
      expect(result.filters[0]).toBeInstanceOf(IsNullExpr);
      expect((result.filters[0] as IsNullExpr).negated).toBe(true);
    });
  });
});
