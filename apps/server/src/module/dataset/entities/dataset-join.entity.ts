import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Dataset } from './dataset.entity';
import { JoinType } from '../dataset.types';

@Entity()
export class datasetJoin {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Dataset)
  @JoinColumn({ name: 'dataset_id' })
  dataset: Dataset;

  @Column({ name: 'left_table_id', type: 'int' })
  leftTableId: number;

  @Column({ name: 'left_column_id', type: 'int' })
  leftColumnId: number;

  @Column({ name: 'right_table_id', type: 'int' })
  rightTableId: number;

  @Column({ name: 'right_column_id', type: 'int' })
  rightColumnId: number;

  @Column({ type: 'enum', enum: JoinType, default: JoinType.INNER })
  joinType: JoinType;
}
