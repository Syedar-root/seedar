import { Dashboard } from '../entities/dashboard.entity';
import { Panel } from '../entities/panel.entity';
import { Layouts } from './create-dashboard.request';

export class DashboardResponse {
  id: string;
  name: string;
  layout: Layouts | null;
  panels: Panel[];
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
