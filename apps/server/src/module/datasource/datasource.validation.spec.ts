import {
  CsvConfigSchema,
  validateDataSourceConfig,
} from './datasource.validation';
import { DataSourceType } from './datasource.types';

describe('数据源配置校验函数', () => {
  it('正常流程：校验 MySQL 配置并补默认端口', () => {
    const result = validateDataSourceConfig(DataSourceType.MYSQL, {
      host: '127.0.0.1',
      database: 'seedar',
      username: 'root',
      password: 'secret',
    });

    expect(result).toEqual({
      host: '127.0.0.1',
      port: '3306',
      database: 'seedar',
      username: 'root',
      password: 'secret',
    });
  });

  it('正常流程：校验 CSV 配置并补默认值', () => {
    expect(
      validateDataSourceConfig(DataSourceType.CSV, {
        filePath: 'data/orders.csv',
      }),
    ).toEqual({
      filePath: 'data/orders.csv',
      delimiter: ',',
      encoding: 'utf-8',
    });
  });

  it('异常流程：Excel 类型走不支持分支并报错', () => {
    expect(() =>
      validateDataSourceConfig(DataSourceType.EXCEL, {
        filePath: 'data/orders.xlsx',
      }),
    ).toThrow('Unsupported data source type: excel');
  });

  it('异常流程：未知类型配置校验失败', () => {
    expect(() =>
      validateDataSourceConfig('unknown' as DataSourceType, {
        filePath: '',
      }),
    ).toThrow();
  });

  it('异常流程：CSV Schema 保持严格校验', () => {
    expect(() =>
      CsvConfigSchema.parse({
        filePath: '',
      }),
    ).toThrow(/File path is required/);
  });
});
