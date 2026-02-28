import { initializeDatabase, getDatabaseManager } from './database';
import { DatabaseSetup } from './setup-database';
import {
  Table, Field, Join, JoinCondition, Query, Dimension, Filter,
  RowLevelMetric, AggregateMetric, SQLGenerator,
  FieldType, AggregateFunction, Operator, JoinType
} from '../index';

/**
 * 数据库测试脚本
 * 连接MySQL数据库，初始化测试数据，并执行各种查询测试
 */
class DatabaseTester {

  /**
   * 初始化数据库连接和数据
   */
  async initialize(): Promise<void> {
    console.log('🔌 连接到MySQL数据库...');

    try {
      await initializeDatabase();
      console.log('✅ 数据库连接成功');

      // 检查数据库是否已初始化
      const isHealthy = await DatabaseSetup.checkDatabaseHealth();

      if (!isHealthy) {
        console.log('🔄 初始化数据库结构和测试数据...');
        await DatabaseSetup.initializeDatabase(true);
      }

    } catch (error) {
      console.error('❌ 数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 测试基本的SQL查询生成和执行
   */
  async testBasicQueries(): Promise<void> {
    console.log('\n🧪 测试基本查询...');

    const dbManager = getDatabaseManager();

    // 1. 简单统计查询
    console.log('1. 用户总数查询:');
    const userCountSQL = 'SELECT COUNT(*) as total_users FROM users';
    console.log('SQL:', userCountSQL);

    const userCountResult = await dbManager.query(userCountSQL);
    console.log('结果:', userCountResult);
    console.log();

    // 2. 模块统计查询
    console.log('2. 模块统计查询:');
    const moduleCountSQL = 'SELECT COUNT(*) as total_modules FROM modules';
    console.log('SQL:', moduleCountSQL);

    const moduleCountResult = await dbManager.query(moduleCountSQL);
    console.log('结果:', moduleCountResult);
    console.log();

    // 3. 活动记录统计
    console.log('3. 活动记录统计:');
    const activityStatsSQL = `
      SELECT
        COUNT(*) as total_activities,
        COUNT(DISTINCT user_id) as unique_users,
        MIN(access_time) as earliest_activity,
        MAX(access_time) as latest_activity
      FROM module_activities
    `;
    console.log('SQL:', activityStatsSQL);

    const activityStatsResult = await dbManager.query(activityStatsSQL);
    console.log('结果:', activityStatsResult);
    console.log();
  }

  /**
   * 测试Metric Engine生成的查询
   */
  async testMetricEngineQueries(): Promise<void> {
    console.log('\n🎯 测试Metric Engine生成的查询...');

    const dbManager = getDatabaseManager();

    // 定义表结构（对应数据库表）
    const usersTable = new Table({
      name: 'users',
      fields: [
        new Field({ name: 'id', type: FieldType.NUMBER }),
        new Field({ name: 'name', type: FieldType.STRING }),
        new Field({ name: 'department', type: FieldType.STRING })
      ],
      alias: 'u',
      description: '用户表'
    });

    const modulesTable = new Table({
      name: 'modules',
      fields: [
        new Field({ name: 'id', type: FieldType.STRING }),
        new Field({ name: 'name', type: FieldType.STRING })
      ],
      alias: 'm',
      description: '模块表'
    });

    const activitiesTable = new Table({
      name: 'module_activities',
      fields: [
        new Field({ name: 'id', type: FieldType.NUMBER }),
        new Field({ name: 'user_id', type: FieldType.NUMBER }),
        new Field({ name: 'module_id', type: FieldType.STRING }),
        new Field({ name: 'access_time', type: FieldType.DATETIME }),
        new Field({ name: 'duration_seconds', type: FieldType.NUMBER }),
        new Field({ name: 'action_type', type: FieldType.STRING })
      ],
      alias: 'a',
      description: '活动记录表'
    });

    // 测试查询1：各部门用户活跃度统计
    console.log('1. 各部门用户活跃度统计:');
    const deptActivityQuery = this.createDepartmentActivityQuery(usersTable, activitiesTable);
    await this.executeMetricQuery(dbManager, deptActivityQuery);

    // 测试查询2：各模块访问统计
    console.log('2. 各模块访问统计:');
    const moduleStatsQuery = this.createModuleStatisticsQuery(modulesTable, activitiesTable);
    await this.executeMetricQuery(dbManager, moduleStatsQuery);

    // 测试查询3：用户行为分析（带筛选条件）
    console.log('3. 用户行为分析（最近7天）:');
    const userBehaviorQuery = this.createUserBehaviorQuery(usersTable, activitiesTable);
    await this.executeMetricQuery(dbManager, userBehaviorQuery);

    // 测试查询4：时长分析
    console.log('4. 用户平均访问时长分析:');
    const durationQuery = this.createDurationAnalysisQuery(usersTable, modulesTable, activitiesTable);
    await this.executeMetricQuery(dbManager, durationQuery);
  }

  /**
   * 创建各部门用户活跃度统计查询
   */
  private createDepartmentActivityQuery(usersTable: Table, activitiesTable: Table): Query {
    // 连接关系
    const userActivityJoin = new Join({
      type: JoinType.LEFT,
      leftTable: usersTable,
      rightTable: activitiesTable,
      conditions: [new JoinCondition({ leftField: 'id', rightField: 'user_id' })]
    });

    // 维度：部门
    const departmentDimension = new Dimension(
      usersTable.getField('department')!,
      '部门'
    );

    // 指标：活跃用户数、总访问次数、总时长
    const activeUsers = new AggregateMetric(
      'active_users',
      AggregateFunction.DISTINCT_COUNT,
      usersTable.getField('id')!,
      false,
      '活跃用户数'
    );

    const totalAccess = new AggregateMetric(
      'total_access',
      AggregateFunction.COUNT,
      activitiesTable.getField('id')!,
      false,
      '总访问次数'
    );

    const totalDuration = new AggregateMetric(
      'total_duration',
      AggregateFunction.SUM,
      activitiesTable.getField('duration_seconds')!,
      false,
      '总访问时长(秒)'
    );

    return new Query(
      usersTable,
      [departmentDimension],
      [activeUsers, totalAccess, totalDuration],
      [],
      [userActivityJoin]
    );
  }

  /**
   * 创建各模块访问统计查询
   */
  private createModuleStatisticsQuery(modulesTable: Table, activitiesTable: Table): Query {
    // 连接关系
    const moduleActivityJoin = new Join({
      type: JoinType.LEFT,
      leftTable: modulesTable,
      rightTable: activitiesTable,
      conditions: [new JoinCondition({ leftField: 'id', rightField: 'module_id' })]
    });

    // 维度：模块名称
    const moduleDimension = new Dimension(
      modulesTable.getField('name')!,
      '模块名称'
    );

    // 指标：访问次数、唯一用户数、平均时长
    const accessCount = new AggregateMetric(
      'access_count',
      AggregateFunction.COUNT,
      activitiesTable.getField('id')!,
      false,
      '访问次数'
    );

    const uniqueUsers = new AggregateMetric(
      'unique_users',
      AggregateFunction.DISTINCT_COUNT,
      activitiesTable.getField('user_id')!,
      false,
      '唯一用户数'
    );

    const avgDuration = new AggregateMetric(
      'avg_duration',
      AggregateFunction.AVG,
      activitiesTable.getField('duration_seconds')!,
      false,
      '平均访问时长(秒)'
    );

    return new Query(
      modulesTable,
      [moduleDimension],
      [accessCount, uniqueUsers, avgDuration],
      [],
      [moduleActivityJoin]
    );
  }

  /**
   * 创建用户行为分析查询（最近7天）
   */
  private createUserBehaviorQuery(usersTable: Table, activitiesTable: Table): Query {
    // 连接关系
    const userActivityJoin = new Join({
      type: JoinType.LEFT,
      leftTable: usersTable,
      rightTable: activitiesTable,
      conditions: [new JoinCondition({ leftField: 'id', rightField: 'user_id' })]
    });

    // 维度：用户名、操作类型
    const userDimension = new Dimension(
      usersTable.getField('name')!,
      '用户名'
    );

    const actionDimension = new Dimension(
      activitiesTable.getField('action_type')!,
      '操作类型'
    );

    // 筛选：最近7天
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateFilter = new Filter(
      activitiesTable.getField('access_time')!,
      Operator.GREATER_EQUAL,
      sevenDaysAgo.toISOString().slice(0, 19).replace('T', ' ')
    );

    // 指标：操作次数、总时长
    const actionCount = new AggregateMetric(
      'action_count',
      AggregateFunction.COUNT,
      activitiesTable.getField('id')!,
      false,
      '操作次数'
    );

    const totalDuration = new AggregateMetric(
      'total_duration',
      AggregateFunction.SUM,
      activitiesTable.getField('duration_seconds')!,
      false,
      '总时长(秒)'
    );

    return new Query(
      usersTable,
      [userDimension, actionDimension],
      [actionCount, totalDuration],
      [dateFilter],
      [userActivityJoin]
    );
  }

  /**
   * 创建时长分析查询
   */
  private createDurationAnalysisQuery(usersTable: Table, modulesTable: Table, activitiesTable: Table): Query {
    // 连接关系
    const userActivityJoin = new Join({
      type: JoinType.LEFT,
      leftTable: usersTable,
      rightTable: activitiesTable,
      conditions: [new JoinCondition({ leftField: 'id', rightField: 'user_id' })]
    });

    const moduleActivityJoin = new Join({
      type: JoinType.LEFT,
      leftTable: activitiesTable,
      rightTable: modulesTable,
      conditions: [new JoinCondition({ leftField: 'module_id', rightField: 'id' })]
    });

    // 维度：用户名、模块名
    const userDimension = new Dimension(
      usersTable.getField('name')!,
      '用户名'
    );

    const moduleDimension = new Dimension(
      modulesTable.getField('name')!,
      '模块名称'
    );

    // 指标：平均时长、最长时长、最短时长
    const avgDuration = new AggregateMetric(
      'avg_duration',
      AggregateFunction.AVG,
      activitiesTable.getField('duration_seconds')!,
      false,
      '平均时长(秒)'
    );

    const maxDuration = new AggregateMetric(
      'max_duration',
      AggregateFunction.MAX,
      activitiesTable.getField('duration_seconds')!,
      false,
      '最长时长(秒)'
    );

    const minDuration = new AggregateMetric(
      'min_duration',
      AggregateFunction.MIN,
      activitiesTable.getField('duration_seconds')!,
      false,
      '最短时长(秒)'
    );

    return new Query(
      usersTable,
      [userDimension, moduleDimension],
      [avgDuration, maxDuration, minDuration],
      [],
      [userActivityJoin, moduleActivityJoin]
    );
  }

  /**
   * 执行Metric Engine查询
   */
  private async executeMetricQuery(dbManager: any, query: Query): Promise<void> {
    try {
      // 生成SQL
      const result = SQLGenerator.generate(query);

      if (result.errors.length > 0) {
        console.log('❌ SQL生成错误:');
        result.errors.forEach((error: string) => console.log('  -', error));
        return;
      }

      console.log('📝 生成的SQL:');
      console.log(result.sql);
      console.log();

      // 执行查询
      console.log('⚡ 执行查询结果:');
      const queryResult = await dbManager.query(result.sql);
      console.log(JSON.stringify(queryResult, null, 2));
      console.log();

    } catch (error) {
      console.error('❌ 查询执行失败:', error);
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<void> {
    try {
      console.log('🚀 开始数据库测试...\n');

      // 初始化
      await this.initialize();

      // 基本查询测试
      await this.testBasicQueries();

      // Metric Engine查询测试
      await this.testMetricEngineQueries();

      console.log('✅ 所有测试完成！');

    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error);
    } finally {
      // 关闭数据库连接
      const dbManager = getDatabaseManager();
      await dbManager.close();
    }
  }
}

// 运行测试
async function main() {
  const tester = new DatabaseTester();
  await tester.runAllTests();
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

export default DatabaseTester;