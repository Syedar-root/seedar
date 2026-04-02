/**
 * 兼容层模块
 * 
 * 本模块提供新旧 API 的兼容适配：
 * - MetricAdapter: 将旧 Metric 类转换为新 Expr 表达式
 * - QueryAdapter: 将旧 Query 对象转换为新 QuerySpec
 * 
 * 使用兼容层可以让现有代码无需修改即可使用新架构。
 */

export * from './metric-adapter';
export * from './query-adapter';
