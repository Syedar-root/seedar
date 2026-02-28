import { Injectable } from '@nestjs/common';
import knex from 'knex';
import { Datasource } from './entities/datasource.entity';
import {
  ClickHouseConfig,
  DataSourceType,
  MySqlConfig,
  PgConfig,
} from './datasource.types';

@Injectable()
export class KnexConnectionFactory {
  /**
   * 根据数据源配置创建 knex 连接实例
   * @param datasource 数据源实体
   * @returns knex 连接实例
   */
  createConnection(datasource: Datasource): knex.Knex {
    switch (datasource.type) {
      case DataSourceType.MYSQL:
        return this.createMySqlConnection(datasource.config as MySqlConfig);
      case DataSourceType.POSTGRES:
        return this.createPostgresConnection(datasource.config as PgConfig);
      case DataSourceType.CLICKHOUSE:
        return this.createClickHouseConnection(
          datasource.config as ClickHouseConfig,
        );
      default:
        throw new Error(`Unsupported data source type: ${datasource.type}`);
    }
  }

  /**
   * 测试数据源连接
   * @param datasource 数据源实体
   * @returns 连接测试结果
   */
  async testConnection(
    datasource: Datasource,
  ): Promise<{ success: boolean; message: string; error?: any }> {
    let connection: knex.Knex | undefined;

    try {
      // 创建连接
      connection = this.createConnection(datasource);

      // 根据数据源类型执行不同的测试查询
      switch (datasource.type) {
        case DataSourceType.MYSQL:
          await connection.raw('SELECT 1 as test');
          break;
        case DataSourceType.POSTGRES:
          await connection.raw('SELECT 1 as test');
          break;
        case DataSourceType.CLICKHOUSE:
          await connection.raw('SELECT 1 as test');
          break;
        default:
          throw new Error(`Unsupported data source type: ${datasource.type}`);
      }

      return {
        success: true,
        message: 'Connection successful',
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${(error as Error).message}`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        error,
      };
    } finally {
      // 销毁连接
      if (connection) {
        await connection.destroy();
      }
    }
  }

  /**
   * 创建 MySQL 连接
   */
  private createMySqlConnection(config: MySqlConfig): knex.Knex {
    return knex({
      client: 'mysql2',
      connection: {
        host: config.host,
        port: parseInt(config.port || '3306'),
        user: config.username,
        password: config.password,
        database: config.database,
        charset: 'utf8mb4',
      },
      pool: {
        min: 0,
        max: 10,
      },
      acquireConnectionTimeout: 60000,
    });
  }

  /**
   * 创建 PostgreSQL 连接
   */
  private createPostgresConnection(config: PgConfig): knex.Knex {
    return knex({
      client: 'pg',
      connection: {
        host: config.host,
        port: parseInt(config.port || '5432'),
        user: config.username,
        password: config.password,
        database: config.database,
      },
      pool: {
        min: 0,
        max: 10,
      },
      acquireConnectionTimeout: 60000,
    });
  }

  /**
   * 创建 ClickHouse 连接
   */
  private createClickHouseConnection(config: ClickHouseConfig): knex.Knex {
    return knex({
      client: 'clickhouse',
      connection: {
        host: config.host,
        port: parseInt(config.port || '8123'),
        user: config.username,
        password: config.password,
        database: config.database,
      },
      pool: {
        min: 0,
        max: 10,
      },
      acquireConnectionTimeout: 60000,
    });
  }
}
