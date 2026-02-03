import mysql from 'mysql2/promise';

/**
 * 数据库连接配置
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
}

/**
 * 数据库连接池管理器
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private pool: mysql.Pool | null = null;
  private config: DatabaseConfig | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * 初始化数据库连接池
   */
  async initialize(config: DatabaseConfig): Promise<void> {
    this.config = config;
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionLimit: config.connectionLimit || 10,
      queueLimit: 0,
      // 添加字符集支持
      charset: 'utf8mb4',
      timezone: '+00:00',
      // 额外的字符集配置
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: true,
    });

    // 测试连接并设置字符集
    try {
      const connection = await this.pool.getConnection();
      // 设置字符集
      await connection.execute('SET NAMES utf8mb4');
      await connection.execute('SET CHARACTER SET utf8mb4');
      await connection.execute('SET character_set_connection=utf8mb4');
      console.log('✅ 数据库连接成功');
      connection.release();
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      throw error;
    }
  }

  /**
   * 获取连接池
   */
  getPool(): mysql.Pool {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化，请先调用 initialize()');
    }
    return this.pool;
  }

  /**
   * 执行查询
   */
  async query(sql: string, params?: any[]): Promise<any> {
    const pool = this.getPool();
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('查询执行失败:', error);
      console.error('SQL:', sql);
      throw error;
    }
  }

  /**
   * 执行多条SQL语句
   */
  async executeMultiple(sqls: string[]): Promise<void> {
    const pool = this.getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      for (const sql of sqls) {
        await connection.execute(sql);
      }

      await connection.commit();
      console.log(`✅ 成功执行 ${sqls.length} 条SQL语句`);
    } catch (error) {
      await connection.rollback();
      console.error('批量执行SQL失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 关闭连接池
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('✅ 数据库连接已关闭');
    }
  }
}

/**
 * 默认数据库配置
 */
export const DEFAULT_DB_CONFIG: DatabaseConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '2586603nnj',
  database: 'metric_test',
  connectionLimit: 10
};

/**
 * 获取数据库管理器实例
 */
export function getDatabaseManager(): DatabaseManager {
  return DatabaseManager.getInstance();
}

/**
 * 初始化数据库连接
 */
export async function initializeDatabase(config: DatabaseConfig = DEFAULT_DB_CONFIG): Promise<void> {
  const dbManager = getDatabaseManager();
  await dbManager.initialize(config);
}

// 导出模式检查器
export { SchemaInspector } from './schema-inspector';