import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Dataset } from './dataset.entity';
import { DatasourceColumn } from '../../datasource/entities/datasource-column.entity';
import {
  MetricType,
  MetricAggregateFunction,
  MetricOperator,
  PeriodOverPeriodType,
  PeriodCalculationMode,
} from '../dataset.types';
import type { AggregateConditionConfig } from '../dataset.types';

@Entity()
export class DatasetMetric {
  /** 主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 数据集 ID */
  @Column({ name: 'dataset_id', type: 'int' })
  dataSetId: number;

  /** 所属数据集 */
  @ManyToOne(() => Dataset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dataset_id' })
  dataset: Dataset;

  /** 指标类型 */
  @Column({ type: 'enum', enum: MetricType, default: MetricType.AGGREGATE })
  metricType: MetricType;

  /** 指标名称（业务语义） */
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  /** 指标别名（可选，用于展示） */
  /** 已废弃 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  alias: string;

  /** 指标描述（可选） */
  @Column({ type: 'text', nullable: true })
  description: string;

  /** 业务名称 */
  @Column({
    name: 'business_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  businessName: string;

  // ==================== 通用配置 ====================

  /** 被计算的字段ID（行级指标、聚合指标使用） */
  @Column({ name: 'data_source_column_id', type: 'int', nullable: true })
  dataSourceColumnId: number;

  /** 被计算的源字段 */
  @ManyToOne(() => DatasourceColumn, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'data_source_column_id' })
  dataSourceColumn: DatasourceColumn;

  // ==================== 行级指标配置 ====================

  /** 行级指标表达式 - 左操作数（字段ID或数字） */
  @Column({ name: 'left_operand', type: 'int', nullable: true })
  leftOperand: number;

  /** 行级指标表达式 - 左操作数字段 */
  @ManyToOne(() => DatasourceColumn, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'left_operand' })
  leftOperandField: DatasourceColumn;

  /** 行级指标表达式 - 运算符 */
  @Column({ name: 'row_operator', type: 'varchar', length: 10, nullable: true })
  rowOperator: MetricOperator;

  /** 行级指标表达式 - 右操作数（字段ID或数字） */
  @Column({ name: 'right_operand', type: 'int', nullable: true })
  rightOperand: number;

  /** 行级指标表达式 - 右操作数字段 */
  @ManyToOne(() => DatasourceColumn, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'right_operand' })
  rightOperandField: DatasourceColumn;

  // ==================== 聚合指标配置 ====================

  /** 聚合函数 */
  @Column({
    name: 'aggregate_function',
    type: 'enum',
    enum: MetricAggregateFunction,
    nullable: true,
  })
  aggregateFunction: MetricAggregateFunction;

  /** 是否去重（用于COUNT DISTINCT） */
  @Column({ name: 'distinct', type: 'boolean', default: false })
  distinct: boolean;

  /** 聚合条件配置（JSON） */
  @Column({ name: 'aggregate_condition', type: 'json', nullable: true })
  aggregateCondition: AggregateConditionConfig;

  // ==================== 后聚合指标配置 ====================

  /** 被聚合的源指标ID */
  @Column({ name: 'source_metric_id', type: 'int', nullable: true })
  sourceMetricId: number;

  /** 被聚合的源指标 */
  @ManyToOne(() => DatasetMetric, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'source_metric_id' })
  sourceMetric: DatasetMetric;

  // ==================== 算术运算指标配置 ====================

  /** 算术运算 - 左操作数指标ID */
  @Column({ name: 'left_metric_id', type: 'int', nullable: true })
  leftMetricId: number;

  /** 算术运算 - 左操作数指标 */
  @ManyToOne(() => DatasetMetric, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'left_metric_id' })
  leftMetric: DatasetMetric;

  /** 算术运算 - 运算符 */
  @Column({
    name: 'arithmetic_operator',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  arithmeticOperator: MetricOperator;

  /** 算术运算 - 右操作数（指标ID或数字） */
  @Column({ name: 'right_metric_operand', type: 'int', nullable: true })
  rightMetricOperand: number;

  /** 算术运算 - 右操作数指标 */
  @ManyToOne(() => DatasetMetric, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'right_metric_operand' })
  rightMetricOperandField: DatasetMetric;

  // ==================== 同环比指标配置 ====================

  /** 同环比 - 原始指标ID */
  @Column({ name: 'base_metric_id', type: 'int', nullable: true })
  baseMetricId: number;

  /** 同环比 - 原始指标 */
  @ManyToOne(() => DatasetMetric, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'base_metric_id' })
  baseMetric: DatasetMetric;

  /** 同环比 - 时间字段ID */
  @Column({ name: 'time_data_source_column_id', type: 'int', nullable: true })
  timeDataSourceColumnId: number;

  /** 同环比 - 时间字段 */
  @ManyToOne(() => DatasourceColumn, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'time_data_source_column_id' })
  timeDataSourceColumn: DatasourceColumn;

  /** 同环比 - 类型 */
  @Column({
    name: 'period_type',
    type: 'enum',
    enum: PeriodOverPeriodType,
    nullable: true,
  })
  periodType: PeriodOverPeriodType;

  /** 同环比 - 计算模式 */
  @Column({
    name: 'calculation_mode',
    type: 'enum',
    enum: PeriodCalculationMode,
    nullable: true,
  })
  calculationMode: PeriodCalculationMode;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
