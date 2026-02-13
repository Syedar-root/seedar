import { Datasource } from '@/module/datasource/entities/datasource.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DatasetTable } from './dataset-table.entity';
import { DatasetStatus, DatasetType } from '../dataset.types';
import { DatasetJoin } from './dataset-join.entity';

@Entity('dataset')
export class Dataset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  description?: string;

  @ManyToOne(() => Datasource)
  @JoinColumn({ name: 'datasource_id' })
  datasource: Datasource;

  @OneToMany(() => DatasetTable, (datasetTable) => datasetTable.dataset, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  datasetTables: DatasetTable[];

  @OneToMany(() => DatasetJoin, (datasetJoin) => datasetJoin.dataset, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  joins: DatasetJoin[];

  @Column({
    type: 'enum',
    enum: DatasetStatus,
    default: DatasetStatus.ACTIVE,
  })
  status: DatasetStatus;

  @Column({
    type: 'enum',
    enum: DatasetType,
    default: DatasetType.WIDE,
  })
  type: DatasetType;

  /**
   * 主表 ID（关联到 DatasetTable）
   */
  @Column({ name: 'main_table_id', type: 'int', nullable: true })
  mainTableId?: number;

  @ManyToOne(() => DatasetTable, { nullable: true })
  @JoinColumn({ name: 'main_table_id' })
  mainTable: DatasetTable;
}
