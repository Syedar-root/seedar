# 数据源模块概览

## 1. 模块职责

数据源模块解决三个问题：

1. 保存外部数据源连接配置
2. 验证该连接是否可用
3. 把外部表、列、外键抽取并缓存到 Seedar 元数据库

## 2. 入口划分

前端入口：

- 列表页 `/datasource`
- 详情页 `/datasource/:id`

后端入口：

- `DatasourceController`
- `DatasourceService`

元数据实体：

- `Datasource`
- `DatasourceTable`
- `DatasourceColumn`
- `DatasourceForeignKey`

## 3. 模块边界

它负责：

- 连接信息
- 元数据抓取
- 元数据缓存

它不负责：

- 数据集字段语义建模
- 指标定义
- 查询执行

这些职责分别落在 `dataset` 与 `query` 模块。

## 4. 上下游关系

上游：

- 用户在前端输入连接参数

下游：

- `dataset` 模块复用它缓存的表、列、外键信息进行建模

## 5. 关键实现特征

1. 配置会在保存前加密。
2. 创建和更新时会测试连接。
3. 元数据抓取支持 MySQL、PostgreSQL、ClickHouse。
4. 元数据抓取失败不一定阻止数据源本身存在。
