/**
 * 表达式模块
 *
 * 本模块提供统一的表达式抽象语法树（AST），支持：
 * - 字段引用表达式
 * - 指标引用表达式
 * - 聚合函数表达式
 * - 算术运算表达式
 * - 条件表达式
 * - 表达式解析（基于 jsep）
 */

export * from './types';
export * from './ast';
export { ExprParser, ParseContext, createParser, parseExpression } from './parser';
