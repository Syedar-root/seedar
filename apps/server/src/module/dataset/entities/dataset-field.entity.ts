import { FieldType } from '../dataset.types';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DatasetTable } from './dataset-table.entity';

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

  /** 所属表ID */
  @Column({ name: 'table_id', type: 'int' })
  tableId: number;

  /** 所属表 */
  @ManyToOne(() => DatasetTable, (table) => table.fields)
  @JoinColumn({ name: 'table_id' })
  table: DatasetTable;

  /** 字段原始名称 */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /** 字段类型 */
  @Column({ type: 'enum', enum: FieldType })
  type: FieldType;

  /** 字段别名 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  alias: string;

  /** 字段描述 */
  @Column({ type: 'text', nullable: true })
  description: string;

  /** 业务名称 */
  @Column({ name: 'business_name', type: 'varchar', length: 255 })
  businessName: string;

  /** 是否为主键字段 */
  @Column({ name: 'is_primary_key', type: 'boolean', default: false })
  isPrimaryKey: boolean;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
