import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DashboardPanelRelation } from './dashboard-panel-relation.entity';
import { Layouts } from '../dto/create-dashboard.request';

@Entity('dashboard')
export class Dashboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'json', nullable: true })
  layout: Layouts | null;

  @OneToMany(() => DashboardPanelRelation, (relation) => relation.dashboard, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  panelRelations: DashboardPanelRelation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
