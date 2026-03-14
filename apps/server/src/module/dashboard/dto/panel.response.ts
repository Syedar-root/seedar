import { Panel } from '../entities/panel.entity';

export class PanelResponse {
  id: string;
  title?: string;
  type: string;
  queryId?: string;
  config?: Record<string, any>;
  width?: number;
  height?: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(panel: Panel): PanelResponse {
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
