import { Dashboard } from '../entities/dashboard.entity';
import { DashboardPanel } from '../entities/dashboard-panel.entity';

export class DashboardResponse {
  id: string;
  name: string;
  layout: Record<string, any> | null;
  panels: DashboardPanel[];
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(dashboard: Dashboard): DashboardResponse {
    const response = new DashboardResponse();
    response.id = dashboard.id;
    response.name = dashboard.name;
    response.layout = dashboard.layout;
    response.panels = dashboard.panelRelations?.map((r) => r.panel) || [];
    response.createdAt = dashboard.createdAt;
    response.updatedAt = dashboard.updatedAt;
    return response;
  }
}
