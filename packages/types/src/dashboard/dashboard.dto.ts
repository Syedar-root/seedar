import { Layouts, PanelType, PanelStatus } from "./dashboard.types";

export interface CreateDashboardRequest {
  name: string;
  layout?: Layouts;
}

export interface UpdateDashboardRequest {
  name?: string;
  layout?: Layouts;
}

export interface CreatePanelRequest {
  title?: string;
  type: PanelType;
  queryId?: string;
  config?: Record<string, any>;
  titleConfig?: Record<string, any>;
  width?: number;
  height?: number;
}

export interface UpdatePanelRequest {
  title?: string;
  type?: PanelType;
  status?: PanelStatus;
  queryId?: string;
  config?: Record<string, any>;
  titleConfig?: Record<string, any>;
  width?: number;
  height?: number;
}
