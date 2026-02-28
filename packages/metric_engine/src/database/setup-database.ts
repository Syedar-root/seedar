import { getDatabaseManager } from './database';

/**
 * 数据库表创建和初始化脚本
 */
export class DatabaseSetup {

  /**
   * 创建用户表
   */
  private static getCreateUsersTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
  }

  /**
   * 创建模块表
   */
  private static getCreateModulesTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS modules (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
  }

  /**
   * 创建模块活动记录表
   */
  private static getCreateModuleActivitiesTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS module_activities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        module_id VARCHAR(50) NOT NULL,
        access_time DATETIME NOT NULL,
        duration_seconds INT NOT NULL,
        action_type ENUM('view', 'edit', 'delete', 'create') NOT NULL,
        session_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
        INDEX idx_user_module (user_id, module_id),
        INDEX idx_access_time (access_time),
        INDEX idx_module_time (module_id, access_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
  }

  /**
   * 获取插入用户数据的SQL
   */
  private static getInsertUsersSQL(): string[] {
    const departments = ['技术部', '销售部', '财务部', '运营部', '市场部', '客服部', '人事部', '产品部'];
    const users = [];

    // 生成20个用户
    for (let i = 1; i <= 20; i++) {
      const department = departments[Math.floor(Math.random() * departments.length)];
      const names = ['张', '李', '王', '赵', '孙', '周', '吴', '郑', '陈', '白', '黄', '梁', '金', '夏', '马'];
      const surnames = ['三', '四', '五', '六', '七', '八', '九', '十', '一', '二', '明', '华', '强', '伟', '刚'];
      const name = names[Math.floor(Math.random() * names.length)] + surnames[Math.floor(Math.random() * surnames.length)];

      users.push({ id: i, name: name, department: department });
    }

    return users.map(user =>
      `INSERT INTO users (id, name, department) VALUES (${user.id}, '${user.name}', '${user.department}') ON DUPLICATE KEY UPDATE name=VALUES(name), department=VALUES(department);`
    );
  }

  /**
   * 获取插入模块数据的SQL
   */
  private static getInsertModulesSQL(): string[] {
    const modules = [
      { id: 'user_mgmt', name: '用户管理' },
      { id: 'order_mgmt', name: '订单管理' },
      { id: 'product_mgmt', name: '商品管理' },
      { id: 'report_analytics', name: '报表分析' },
      { id: 'system_config', name: '系统配置' }
    ];

    return modules.map(module =>
      `INSERT INTO modules (id, name) VALUES ('${module.id}', '${module.name}') ON DUPLICATE KEY UPDATE name=VALUES(name);`
    );
  }

  /**
   * 生成模拟活动数据 - 基于部门权限的更真实活跃度分布
   */
  private static generateActivityData(): string[] {
    const modules = ['user_mgmt', 'order_mgmt', 'product_mgmt', 'report_analytics', 'system_config'];
    const actions = ['view', 'edit', 'delete', 'create'];

    const sqls: string[] = [];
    const now = new Date();

    // 定义各部门对模块的访问权限（true表示可以访问）
    const departmentPermissions: { [key: string]: { [key: string]: boolean } } = {
      '技术部': {
        'user_mgmt': true,        // 用户管理
        'system_config': true,    // 系统配置
        'report_analytics': false, // 不常看报表
        'order_mgmt': false,      // 不访问订单
        'product_mgmt': false     // 不访问商品
      },
      '销售部': {
        'order_mgmt': true,       // 订单管理
        'product_mgmt': true,     // 商品管理
        'report_analytics': true, // 销售报表
        'user_mgmt': false,       // 不访问用户管理
        'system_config': false    // 不访问系统配置
      },
      '财务部': {
        'report_analytics': true, // 财务报表
        'order_mgmt': false,      // 不直接管理订单
        'user_mgmt': false,       // 不访问用户管理
        'product_mgmt': false,    // 不访问商品管理
        'system_config': false    // 不访问系统配置
      },
      '运营部': {
        'order_mgmt': true,       // 订单运营
        'user_mgmt': true,        // 用户运营
        'product_mgmt': true,     // 产品运营
        'report_analytics': true, // 运营报表
        'system_config': false    // 不访问系统配置
      },
      '市场部': {
        'product_mgmt': true,     // 产品推广
        'report_analytics': true, // 市场分析
        'order_mgmt': false,      // 不直接管理订单
        'user_mgmt': false,       // 不访问用户管理
        'system_config': false    // 不访问系统配置
      }
    };

    // 生成最近30天的活动数据 - 改为批量插入以减少prepared statements
    const allInserts: string[] = [];

    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const currentDate = new Date(now);
      currentDate.setDate(currentDate.getDate() - dayOffset);

      // 每天生成30-50条随机记录（减少数量）
      const recordsPerDay = Math.floor(Math.random() * 20) + 30;

      for (let i = 0; i < recordsPerDay; i++) {
        // 随机选择用户ID (1-20)
        const userId = Math.floor(Math.random() * 20) + 1;

        // 根据用户ID分配部门（每4个用户一个部门）
        const departments = Object.keys(departmentPermissions);
        const userDepartment = departments[Math.floor((userId - 1) / 4)];

        // 获取该部门可以访问的模块
        const departmentPerms = departmentPermissions[userDepartment];
        const accessibleModules = modules.filter(module => departmentPerms[module]);

        // 如果没有可访问的模块，跳过这条记录
        if (accessibleModules.length === 0) {
          continue;
        }

        // 从可访问的模块中随机选择
        const selectedModule = accessibleModules[Math.floor(Math.random() * accessibleModules.length)];

        const actionType = actions[Math.floor(Math.random() * actions.length)];
        const duration = Math.floor(Math.random() * 300) + 10;
        const sessionId = `session_${Math.floor(Math.random() * 10000)}`;

        // 当天随机时间
        const randomTime = new Date(
          currentDate.getTime() + Math.floor(Math.random() * 24 * 60 * 60 * 1000)
        );
        const accessTime = randomTime.toISOString().slice(0, 19).replace('T', ' ');

        allInserts.push(`(${userId}, '${selectedModule}', '${accessTime}', ${duration}, '${actionType}', '${sessionId}')`);
      }
    }

    // 批量插入，每100条记录一个INSERT语句
    const batchSize = 100;
    for (let i = 0; i < allInserts.length; i += batchSize) {
      const batch = allInserts.slice(i, i + batchSize);
      sqls.push(`
        INSERT INTO module_activities (user_id, module_id, access_time, duration_seconds, action_type, session_id)
        VALUES ${batch.join(', ')};
      `);
    }

    return sqls;
  }

  /**
   * 清空表数据（可选）
   */
  private static getTruncateTablesSQL(): string[] {
    return [
      'SET FOREIGN_KEY_CHECKS = 0;',
      'TRUNCATE TABLE module_activities;',
      'TRUNCATE TABLE users;',
      'TRUNCATE TABLE modules;',
      'SET FOREIGN_KEY_CHECKS = 1;'
    ];
  }

  /**
   * 初始化数据库
   */
  static async initializeDatabase(clearExistingData: boolean = false): Promise<void> {
    const dbManager = getDatabaseManager();

    console.log('🏗️ 开始初始化数据库...');

    try {
      const createTableSQLs = [
        this.getCreateUsersTableSQL(),
        this.getCreateModulesTableSQL(),
        this.getCreateModuleActivitiesTableSQL()
      ];

      // 创建表结构
      console.log('📋 创建表结构...');
      for (const sql of createTableSQLs) {
        await dbManager.query(sql);
      }
      console.log('✅ 表结构创建完成');

      // 可选：清空现有数据
      if (clearExistingData) {
        console.log('🗑️ 清空现有数据...');
        const truncateSQLs = this.getTruncateTablesSQL();
        for (const sql of truncateSQLs) {
          await dbManager.query(sql);
        }
        console.log('✅ 数据清空完成');
      }

      // 插入基础数据
      console.log('📥 插入基础数据...');
      const insertUsersSQLs = this.getInsertUsersSQL();
      const insertModulesSQLs = this.getInsertModulesSQL();

      for (const sql of [...insertUsersSQLs, ...insertModulesSQLs]) {
        await dbManager.query(sql);
      }
      console.log('✅ 基础数据插入完成');

      // 生成并插入活动数据
      console.log('📊 生成并插入活动数据...');
      const activitySQLs = this.generateActivityData();

      // 分批插入以避免内存问题
      const batchSize = 100;
      for (let i = 0; i < activitySQLs.length; i += batchSize) {
        const batch = activitySQLs.slice(i, i + batchSize);
        for (const sql of batch) {
          await dbManager.query(sql);
        }
        console.log(`  📈 已插入 ${Math.min(i + batchSize, activitySQLs.length)}/${activitySQLs.length} 条活动记录`);
      }

      console.log('✅ 数据库初始化完成！');

      // 显示统计信息
      await this.showStatistics();

    } catch (error) {
      console.error('❌ 数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 显示数据库统计信息
   */
  private static async showStatistics(): Promise<void> {
    const dbManager = getDatabaseManager();

    try {
      console.log('\n📊 数据库统计信息:');

      const userCount = await dbManager.query('SELECT COUNT(*) as count FROM users');
      console.log(`👥 用户数量: ${userCount[0].count}`);

      const moduleCount = await dbManager.query('SELECT COUNT(*) as count FROM modules');
      console.log(`📱 模块数量: ${moduleCount[0].count}`);

      const activityCount = await dbManager.query('SELECT COUNT(*) as count FROM module_activities');
      console.log(`📈 活动记录总数: ${activityCount[0].count}`);

      const dateRange = await dbManager.query(`
        SELECT
          MIN(access_time) as earliest,
          MAX(access_time) as latest
        FROM module_activities
      `);
      console.log(`📅 数据时间范围: ${dateRange[0].earliest} ~ ${dateRange[0].latest}`);

    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  }

  /**
   * 检查数据库连接和表结构
   */
  static async checkDatabaseHealth(): Promise<boolean> {
    const dbManager = getDatabaseManager();

    try {
      // 检查表是否存在
      const tables = await dbManager.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        AND table_name IN ('users', 'modules', 'module_activities')
      `);

      if (tables.length !== 3) {
        console.log('❌ 部分表不存在，需要重新初始化数据库');
        return false;
      }

      // 检查是否有数据
      const userCount = await dbManager.query('SELECT COUNT(*) as count FROM users');
      const activityCount = await dbManager.query('SELECT COUNT(*) as count FROM module_activities');

      if (userCount[0].count === 0 || activityCount[0].count === 0) {
        console.log('⚠️ 表存在但没有数据，需要插入测试数据');
        return false;
      }

      console.log('✅ 数据库状态正常');
      return true;

    } catch (error) {
      console.error('❌ 数据库健康检查失败:', error);
      return false;
    }
  }
}