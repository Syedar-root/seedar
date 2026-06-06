import { Field, Table, FieldType, QueryBuilder } from '../../src';
import { parseMinimalDslToQuery } from '../../src/dsl/parse-dsl';

describe('parseMinimalDslToQuery', () => {
  const tables = [
    new Table({
      name: 'orders',
      fields: [
        new Field({ name: 'id', type: FieldType.NUMBER, alias: 'order_id' }),
        new Field({
          name: 'customer_id',
          type: FieldType.NUMBER,
          alias: 'customer_id',
        }),
        new Field({
          name: 'amount',
          type: FieldType.DECIMAL,
          alias: 'order_amount',
        }),
      ],
    }),
    new Table({
      name: 'customers',
      fields: [
        new Field({ name: 'id', type: FieldType.NUMBER, alias: 'customer_id' }),
        new Field({
          name: 'name',
          type: FieldType.STRING,
          alias: 'customer_name',
        }),
      ],
    }),
  ];

  it('should translate a minimal DSL into SQL', async () => {
    const query = await parseMinimalDslToQuery(
      {
        table: 'orders',
        dimensions: ['id', 'customers.name'],
        metrics: [
          { type: 'sum', field: 'amount', alias: 'total_amount' },
        ],
        filters: [{ field: 'amount', op: '>', value: 100 }],
        joins: [
          {
            table: 'customers',
            type: 'left',
            on: [{ left: 'customer_id', right: 'id' }],
          },
        ],
      },
      tables,
    );

    const sql = QueryBuilder.build(query);

    expect(sql).toContain('SELECT');
    expect(sql).toContain('FROM orders t1');
    expect(sql).toContain('LEFT JOIN customers t2');
    expect(sql).toContain('t1.customer_id = t2.id');
    expect(sql).toContain('WHERE order_amount > 100');
    expect(sql).toContain('GROUP BY order_id, customer_name');
  });

  it('should fail fast when the main table is missing', async () => {
    await expect(
      parseMinimalDslToQuery(
        {
          table: 'missing',
        },
        tables,
      ),
    ).rejects.toThrow('找不到主表');
  });
});
