import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { PanelType } from '../panel-types.enum';
import { Query } from '@/module/query/entities/query.entity';
import { DashboardPanelRelation } from './dashboard-panel-relation.entity';

@Entity('panel')
export class Panel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'title', length: 255, nullable: true })
  title?: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: PanelType,
    default: PanelType.CHART,
  })
  type: PanelType;

  @Column({ name: 'query_id', nullable: true })
  queryId?: string;

  @ManyToOne(() => Query, { nullable: true })
  @JoinColumn({ name: 'query_id' })
  query?: Query;

  @Column({ name: 'config', type: 'json', nullable: true })
  config?: Record<string, any>;

  @Column({ name: 'width', type: 'int', nullable: true })
  width?: number;

  @Column({ name: 'height', type: 'int', nullable: true })
  height?: number;

  @OneToMany(() => DashboardPanelRelation, (relation) => relation.panel, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  dashboardRelations: DashboardPanelRelation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
