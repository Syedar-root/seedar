import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DataSourceType } from '../datasource.types';
import { DataSourceStatus } from '../dto/datasource.response';

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

  @Column({ type: 'datetime', nullable: true })
  lastValidateAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
