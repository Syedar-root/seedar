import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DatasourceTable } from './datasource-table.entity';
import { NormalizedDataType } from '../datasource.types';

@Entity('datasource_columns')
export class DatasourceColumn {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'table_id', type: 'int' })
  tableId: number;

  @Column({ name: 'column_name', type: 'varchar', length: 255 })
  columnName: string;

  @Column({ name: 'raw_data_type', type: 'varchar', length: 255 })
  rawDataType: string;

  @Column({
    name: 'normalized_type',
    type: 'enum',
    enum: NormalizedDataType,
  })
  normalizedType: NormalizedDataType;

  @Column({ type: 'boolean', default: true })
  nullable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index()
  @ManyToOne(() => DatasourceTable, (table) => table.columns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'table_id' })
  table: DatasourceTable;
}
