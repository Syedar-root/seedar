import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Dashboard } from './dashboard.entity';
import { Panel } from './panel.entity';

@Entity('dashboard_panels')
export class DashboardPanelRelation {
  @PrimaryColumn({ name: 'dashboard_id', type: 'char', length: 36 })
  dashboardId: string;

  @PrimaryColumn({ name: 'panel_id', type: 'char', length: 36 })
  panelId: string;

  @ManyToOne(() => Dashboard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dashboard_id' })
  dashboard: Dashboard;

  @ManyToOne(() => Panel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'panel_id' })
  panel: Panel;
}
