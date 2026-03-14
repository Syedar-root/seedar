import { DashboardPanel } from '../entities/dashboard-panel.entity';

export class PanelResponse {
  id: string;
  title: string | null;
  type: string;
  queryId: string | null;
  config: Record<string, any> | null;
  width: number | null;
  height: number | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(panel: DashboardPanel): PanelResponse {
    const response = new PanelResponse();
    response.id = panel.id;
    response.title = panel.title;
    response.type = panel.type;
    response.queryId = panel.queryId;
    response.config = panel.config;
    response.width = panel.width;
    response.height = panel.height;
    response.createdAt = panel.createdAt;
    response.updatedAt = panel.updatedAt;
    return response;
  }
}
