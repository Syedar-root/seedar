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

describe('Dynamic Join Selection', () => {
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

  describe('V2 Transformer', () => {
    it('should not generate joins for single table query', () => {
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

    it('should generate joins for multi-table query via dimensions', () => {
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

    it('should generate joins for multi-table query via metrics', () => {
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

    it('should generate multiple joins for query with multiple table dependencies', () => {
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

    it('should generate joins for filters', () => {
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

    it('should assign alias correctly when traversing a join in reverse', () => {
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

    it('should keep backward compatibility for object dimensions with alias', () => {
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

    it('should build time_grain derived dimension as CallExpr with metadata', () => {
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

    it('should build orderBy for selected dimensions and metrics', () => {
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

    it('should require alias when one field maps to multiple selected dimensions', () => {
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

    it('should support alias-based orderBy for derived dimensions', () => {
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

    it('should build bucket derived dimension as ConditionalExpr chain', () => {
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

    it('should build mapping derived dimension as first-match ConditionalExpr chain', () => {
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

    it('should build expression derived dimension and keep alias metadata', () => {
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

    it('should collect joins from derived dimensions on non-main table', () => {
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

    it('should reject derived dimensions without alias', () => {
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

    it('should reject unsupported derivedKind', () => {
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

    it('should reject expression derived dimension with #M refs', () => {
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

  describe('V1 Transformer', () => {
    it('should not generate joins for single table query', () => {
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

    it('should generate joins for multi-table query via dimensions', () => {
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

    it('should generate joins for multi-table query via metrics', () => {
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

    it('should generate multiple joins for query with multiple table dependencies', () => {
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

    it('should generate joins for filters', () => {
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

describe('Period Comparison Expressions', () => {
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

  it('should parse MOM(#M,#F) into PeriodComparisonExpr', () => {
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

  it('should collect joins for referenced metric and time field tables', () => {
    const result = DSLTransformerV2.transform(
      createDsl(),
      mockDatasetInfo,
      mockTables,
    );
    expect(result.joins.some((join) => join.table === 'order_dates')).toBe(
      true,
    );
  });

  it('should respect calculationMode absolute override', () => {
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

  it('should reject calculationMode both', () => {
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

  it('should reject missing matching time filter', () => {
    const dsl = createDsl({ filters: [{ fieldId: 3, op: '=', value: 100 }] });
    expect(() =>
      DSLTransformerV2.transform(dsl, mockDatasetInfo, mockTables),
    ).toThrow(/time\s*filter|时间过滤器/i);
  });

  it('should derive the period comparison metric from the base aggregate', () => {
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

  it('should build orderBy for selected temp metrics', () => {
    const result = DSLTransformerV2.transform(
      createDsl({
        orderBy: [{ tempMetricId: 'temp-pop', dir: 'desc' }],
      }),
      mockDatasetInfo,
      mockTables,
    );

    expect(result.orderBy).toEqual([{ expr: 'amount_mom', dir: 'desc' }]);
  });

  it('should reject temp metrics without an effective timeFieldId', () => {
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

describe('Filter Expression Types', () => {
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

  describe('IN Expression', () => {
    it('should transform IN filter to InExpr', () => {
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

    it('should transform NOT IN filter to InExpr with negated=true', () => {
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

  describe('BETWEEN Expression', () => {
    it('should transform BETWEEN filter to BetweenExpr', () => {
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

    it('should transform NOT BETWEEN filter to BetweenExpr with negated=true', () => {
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

  describe('LIKE Expression', () => {
    it('should transform LIKE filter to LikeExpr', () => {
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

    it('should transform NOT LIKE filter to LikeExpr with negated=true', () => {
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

  describe('IS NULL Expression', () => {
    it('should transform IS NULL filter to IsNullExpr', () => {
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

    it('should transform IS NOT NULL filter to IsNullExpr with negated=true', () => {
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
