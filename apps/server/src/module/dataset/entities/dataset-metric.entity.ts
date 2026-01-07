import { DatasetField } from './dataset-field.entity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity()
export class DatasetMetric {
  /** 主键 */
  @PrimaryGeneratedColumn()
  id: number;

  /** 数据集 ID */
  @Column({ name: 'dataset_id', type: 'int' })
  dataSetId: number;

  /** 指标名称（用户语义） */
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  /** 指标表达式（SQL 片段） */
  // TODO: 指标DSL，防止直接注入
  @Column({ name: 'expression', type: 'text' })
  expression: string;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
