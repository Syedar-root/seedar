import { FieldRole, Aggregation } from '../dataset.types';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class DatasetField {
  @PrimaryGeneratedColumn()
  id: number;

  /** 数据集 ID */
  @Column({ name: 'dataset_id', type: 'int' })
  dataSetId: number;

  /** 引用的物理字段（模块一） */
  @Column({ name: 'data_source_column_id', type: 'int' })
  dataSourceColumnId: number;

  /** 展示名称（业务语义） */
  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  displayName: string;

  /** 字段角色 */
  @Column({ type: 'enum', enum: FieldRole })
  role: FieldRole;

  /** 允许的聚合方式 */
  @Column({
    type: 'simple-array',
    comment: '允许的聚合方式',
  })
  aggregations: Aggregation[];

  /** 是否可筛选 */
  @Column({ name: 'is_filterable', type: 'boolean', default: false })
  isFilterable: boolean;

  /** 是否可分组 */
  @Column({ name: 'is_groupable', type: 'boolean', default: false })
  isGroupable: boolean;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
