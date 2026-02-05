import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Dataset } from './dataset.entity';
import { DatasourceTable } from '@/module/datasource/entities/datasource-table.entity';
import { DatasetField } from './dataset-field.entity';

@Entity('dataset_tables')
export class DatasetTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'dataset_id', type: 'int' })
  datasetId: number;

  @Column({ name: 'table_id', type: 'int' })
  tableId: number;

  @Column({ name: 'dataset_name', type: 'varchar', length: 100 })
  datasetName: string;

  @Column({ name: 'table_name', type: 'varchar', length: 255 })
  tableName: string;

  /** 表描述（可选） */
  @Column({ type: 'text', nullable: true })
  description: string;

  /** 字段列表 */
  @OneToMany(() => DatasetField, (field) => field.table)
  fields: DatasetField[];

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Dataset, (dataset) => dataset.datasetTables, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dataset_id' })
  dataset: Dataset;

  @ManyToOne(() => DatasourceTable, (table) => table.datasetTables, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'table_id' })
  table: DatasourceTable;
}
