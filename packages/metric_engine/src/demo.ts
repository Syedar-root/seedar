import {
  Field,
  Table,
  Join,
  JoinCondition,
  RowLevelMetric,
  AggregateMetric,
  MetricExpression,
  Dimension,
  Filter,
  Query,
  SQLGenerator,
  FieldType,
  AggregateFunction,
  Operator,
  JoinType
} from './index';

/**
 * 演示如何使用实体类构建查询并生成SQL
 */
function demo() {
  console.log('=== 指标引擎实体类演示 ===\n');

  // 1. 定义数据表结构
  console.log('1. 定义数据表结构:');

  // 用户表
  const userTable = new Table({
    name: 'users',
    fields: [
      new Field({ name: 'id', type: FieldType.NUMBER, alias: 'user_id' }),
      new Field({ name: 'name', type: FieldType.STRING, alias: 'user_name' }),
      new Field({ name: 'email', type: FieldType.STRING }),
      new Field({ name: 'created_at', type: FieldType.DATETIME })
    ],
    alias: 'u',
    description: '用户表'
  });

  // 订单表
  const orderTable = new Table({
    name: 'orders',
    fields: [
      new Field({ name: 'id', type: FieldType.NUMBER, alias: 'order_id' }),
      new Field({ name: 'user_id', type: FieldType.NUMBER }),
      new Field({ name: 'amount', type: FieldType.DECIMAL }),
      new Field({ name: 'status', type: FieldType.STRING }),
      new Field({ name: 'created_at', type: FieldType.DATETIME })
    ],
    alias: 'o',
    description: '订单表'
  });

  console.log('用户表:', userTable.getFullName());
  console.log('订单表:', orderTable.getFullName());
  console.log();

  // 2. 定义表连接
  console.log('2. 定义表连接:');
  const userOrderJoin = new Join({
    type: JoinType.LEFT,
    leftTable: userTable,
    rightTable: orderTable,
    conditions: [new JoinCondition({ leftField: 'id', rightField: 'user_id' })]
  });
  console.log('连接SQL:', userOrderJoin.toSQL());
  console.log();

  // 3. 定义指标
  console.log('3. 定义指标:');

  // 行级指标：订单金额的税后计算
  const taxRateField = new Field('tax_rate', FieldType.DECIMAL);
  const taxExpression = new MetricExpression(
    new Field('amount', FieldType.DECIMAL),
    Operator.MULTIPLY,
    taxRateField
  );
  const afterTaxAmount = new RowLevelMetric(
    'after_tax_amount',
    taxExpression,
    '税后金额'
  );

  // 聚合指标：订单总金额
  const totalAmount = new AggregateMetric(
    'total_amount',
    AggregateFunction.SUM,
    new Field('amount', FieldType.DECIMAL),
    false,
    '总金额'
  );

  // 聚合指标：订单数量
  const orderCount = new AggregateMetric(
    'order_count',
    AggregateFunction.COUNT,
    new Field('id', FieldType.NUMBER),
    false,
    '订单数量'
  );

  console.log('行级指标:', afterTaxAmount.name, '->', afterTaxAmount.toSQL());
  console.log('聚合指标:', totalAmount.name, '->', totalAmount.toSQL());
  console.log('聚合指标:', orderCount.name, '->', orderCount.toSQL());
  console.log();

  // 4. 定义维度和筛选条件
  console.log('4. 定义维度和筛选条件:');

  // 维度：按用户分组
  const userDimension = new Dimension(
    new Field('name', FieldType.STRING, undefined, '用户名'),
    '用户名'
  );

  // 筛选条件：只看已完成的订单
  const statusFilter = new Filter(
    new Field('status', FieldType.STRING),
    Operator.EQUALS,
    'completed'
  );

  console.log('维度:', userDimension.toSQL());
  console.log('筛选条件:', statusFilter.toSQL());
  console.log();

  // 5. 构建查询
  console.log('5. 构建查询:');
  const query = new Query(
    userTable,
    [userDimension],
    [totalAmount, orderCount],
    [statusFilter],
    [userOrderJoin]
  );

  // console.log('查询JSON Schema:');
  // console.log(JSON.stringify(query.toJSONSchema(), null, 2));
  // console.log();

  // 6. 生成SQL
  console.log('6. 生成SQL:');
  const result = SQLGenerator.generate(query);

  if (result.errors.length > 0) {
    console.log('生成错误:');
    result.errors.forEach(error => console.log('-', error));
  } else {
    console.log('生成的SQL:');
    console.log(result.sql);
  }

  // 7. 分页功能演示
  console.log('\n=== 分页功能演示 ===\n');

  // 7.1 使用 limit 限制返回条数
  console.log('7.1 限制返回 5 条记录:');
  const queryWithLimit = query.withLimit(5);
  const resultWithLimit = SQLGenerator.generate(queryWithLimit);
  console.log(resultWithLimit.sql);

  // 7.2 使用分页（limit + offset）
  console.log('\n7.2 第 2 页，每页 5 条记录:');
  const queryWithPage2 = query.withPagination(5, 5); // limit=5, offset=5
  const resultWithPage2 = SQLGenerator.generate(queryWithPage2);
  console.log(resultWithPage2.sql);

  // 7.3 第 3 页，每页 10 条记录
  console.log('\n7.3 第 3 页，每页 10 条记录:');
  const queryWithPage3 = query.withPagination(10, 20); // limit=10, offset=20
  const resultWithPage3 = SQLGenerator.generate(queryWithPage3);
  console.log(resultWithPage3.sql);
}

// 运行演示
demo();