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
import { Query } from '@/module/query/entities/query.entity';
import { PanelType } from '../panel-type.enum';
import { DashboardPanelRelation } from './dashboard-panel-relation.entity';

@Entity('dashboard_panel')
export class DashboardPanel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: true })
  title: string | null;

  @Column({
    type: 'enum',
    enum: PanelType,
  })
  type: PanelType;

  @Column({ name: 'query_id', nullable: true })
  queryId: string | null;

  @ManyToOne(() => Query, { nullable: true })
  @JoinColumn({ name: 'query_id' })
  query: Query | null;

  @Column({ type: 'json', nullable: true })
  config: Record<string, any> | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

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
