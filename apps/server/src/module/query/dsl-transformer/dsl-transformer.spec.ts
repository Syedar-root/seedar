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
} from '../../dataset/dataset.types';

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
