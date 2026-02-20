import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Datasource } from './datasource.entity';
import { DatasourceColumn } from './datasource-column.entity';
import { DatasetTable } from '@/module/dataset/entities/dataset-table.entity';

@Entity('datasource_tables')
export class DatasourceTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'data_source_id', type: 'int' })
  dataSourceId: number;

  @Column({ name: 'table_name', type: 'varchar', length: 255 })
  tableName: string;

  @Column({
    name: 'table_comment',
    type: 'text',
    nullable: true,
  })
  tableComment?: string;

  @Column({
    name: 'row_count',
    type: 'int',
    nullable: true,
  })
  rowCount?: number;

  /** 主键字段 ID */
  @Column({ name: 'primary_field_id', type: 'int', nullable: true })
  primaryFieldId?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index()
  @ManyToOne(() => Datasource, (datasource) => datasource.tables, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'data_source_id' })
  datasource: Datasource;

  @OneToMany(() => DatasourceColumn, (column) => column.table)
  columns: DatasourceColumn[];

  @OneToMany(
    () => DatasetTable,
    (datasetTable) => datasetTable.datasourceTable,
    {
      cascade: true,
      onDelete: 'CASCADE',
    },
  )
  datasetTables: DatasetTable[];
}
