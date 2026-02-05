import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Dataset } from './dataset.entity';
import { JoinType } from '../dataset.types';

@Entity()
export class DatasetJoin {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Dataset)
  @JoinColumn({ name: 'dataset_id' })
  dataset: Dataset;

  /** 连接类型 */
  @Column({ type: 'enum', enum: JoinType, default: JoinType.INNER })
  joinType: JoinType;

  /** 左表ID */
  @Column({ name: 'left_table_id', type: 'int' })
  leftTableId: number;

  /** 左表字段名 */
  @Column({ name: 'left_field', type: 'varchar', length: 255 })
  leftField: string;

  /** 右表ID */
  @Column({ name: 'right_table_id', type: 'int' })
  rightTableId: number;

  /** 右表字段名 */
  @Column({ name: 'right_field', type: 'varchar', length: 255 })
  rightField: string;

  /** 连接运算符（默认为等于） */
  @Column({ type: 'varchar', length: 20, default: '=' })
  operator: string;
}
