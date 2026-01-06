import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { DataSourceType } from '../datasource.types';
import { DataSourceStatus } from '../dto/datasource.response';
import { optionalUtcTimeTransformer } from '../transformers/utc-time.transformer';
import { DatasourceTable } from './datasource-table.entity';

@Entity('datasources')
export class Datasource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: DataSourceType,
  })
  type: DataSourceType;

  @Column({ type: 'json' })
  config: Record<string, any>;

  @Column({
    type: 'enum',
    enum: DataSourceStatus,
    default: DataSourceStatus.ACTIVE,
  })
  status: DataSourceStatus;

  @Column({
    type: 'datetime',
    nullable: true,
    transformer: optionalUtcTimeTransformer,
  })
  lastValidateAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => DatasourceTable, (table) => table.datasource)
  tables: DatasourceTable[];
}
