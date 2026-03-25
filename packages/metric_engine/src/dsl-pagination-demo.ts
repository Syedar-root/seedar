import { parseMinimalDslToQuery, MinimalDSL } from './dsl/parse-dsl';
import { KnexSQLGenerator } from './v1/query/knex-sql-generator';
import { Table, Field, FieldType } from './index';

async function dslPaginationDemo() {
  console.log('=== DSL 分页功能演示 ===\n');

  const tables: Table[] = [
    new Table({
      name: 'users',
      fields: [
        new Field({ name: 'id', type: FieldType.NUMBER }),
        new Field({ name: 'name', type: FieldType.STRING }),
        new Field({ name: 'region', type: FieldType.STRING }),
        new Field({ name: 'created_at', type: FieldType.DATETIME })
      ],
      alias: 'u',
      description: '用户表'
    }),
    new Table({
      name: 'orders',
      fields: [
        new Field({ name: 'id', type: FieldType.NUMBER }),
        new Field({ name: 'user_id', type: FieldType.NUMBER }),
        new Field({ name: 'amount', type: FieldType.DECIMAL }),
        new Field({ name: 'status', type: FieldType.STRING }),
        new Field({ name: 'created_at', type: FieldType.DATETIME })
      ],
      alias: 'o',
      description: '订单表'
    })
  ];

  console.log('场景1: 不分页的 DSL');
  console.log('=====================================\n');
  const dsl1: MinimalDSL = {
    table: 'users',
    dimensions: [
      { field: 'region', alias: '地区' }
    ],
    metrics: [
      { type: 'count', name: 'user_count', alias: '用户数' }
    ]
  };

  const query1 = await parseMinimalDslToQuery(dsl1, tables);
  const result1 = KnexSQLGenerator.generateSQLString(query1);
  console.log('DSL:', JSON.stringify(dsl1, null, 2));
  console.log('\n生成的 SQL:');
  console.log(result1);
  console.log();

  console.log('场景2: 带有 LIMIT 的 DSL');
  console.log('=====================================\n');
  const dsl2: MinimalDSL = {
    table: 'users',
    dimensions: [
      { field: 'region', alias: '地区' }
    ],
    metrics: [
      { type: 'count', name: 'user_count', alias: '用户数' }
    ],
    limit: 3
  };

  const query2 = await parseMinimalDslToQuery(dsl2, tables);
  const result2 = KnexSQLGenerator.generateSQLString(query2);
  console.log('DSL:', JSON.stringify(dsl2, null, 2));
  console.log('\n生成的 SQL:');
  console.log(result2);
  console.log();

  console.log('场景3: 第 2 页，每页 2 条记录 (LIMIT 2 OFFSET 2)');
  console.log('=====================================\n');
  const dsl3: MinimalDSL = {
    table: 'users',
    dimensions: [
      { field: 'region', alias: '地区' }
    ],
    metrics: [
      { type: 'count', name: 'user_count', alias: '用户数' }
    ],
    limit: 2,
    offset: 2
  };

  const query3 = await parseMinimalDslToQuery(dsl3, tables);
  const result3 = KnexSQLGenerator.generateSQLString(query3);
  console.log('DSL:', JSON.stringify(dsl3, null, 2));
  console.log('\n生成的 SQL:');
  console.log(result3);
  console.log();

  console.log('场景4: 带有 JOIN 和分页的复杂 DSL');
  console.log('=====================================\n');
  const dsl4: MinimalDSL = {
    table: 'users',
    dimensions: [
      { field: 'name', alias: '用户名' },
      { field: 'region', alias: '地区' }
    ],
    metrics: [
      { type: 'sum', field: 'orders.amount', name: 'total_amount', alias: '总消费' },
      { type: 'count', name: 'order_count', alias: '订单数' }
    ],
    joins: [
      { table: 'orders', alias: 'o', on: [{ left: 'id', right: 'user_id' }], type: 'left' }
    ],
    filters: [
      { field: 'orders.status', op: '=', value: 'completed' }
    ],
    limit: 5,
    offset: 10
  };

  const query4 = await parseMinimalDslToQuery(dsl4, tables);
  const result4 = KnexSQLGenerator.generateSQLString(query4);
  console.log('DSL:', JSON.stringify(dsl4, null, 2));
  console.log('\n生成的 SQL:');
  console.log(result4);
  console.log();

  console.log('=== DSL 分页功能演示完成 ===');
}

dslPaginationDemo().catch(console.error);
