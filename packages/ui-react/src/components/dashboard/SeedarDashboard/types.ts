import type { ReactNode } from "react";
import type {
  DashboardResponse,
  Layouts,
  UpdateDashboardRequest,
} from "#pkg/seedar/types";

import type {
  AddPanelScope,
  SeedarBreakpoint,
} from "../../../utils/dashboard-layout/constants";

export interface SeedarDashboardProps {
  dashboardId: string;
  mode?: "edit" | "view";
  autoUpdate?: boolean;
  header?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  panelHeaderExtra?: (panelId: string) => ReactNode;
}

export interface AddPanelDialogOptions {
  defaultSize?: { w: number; h: number };
  scope?: AddPanelScope;
}

export interface SeedarDashboardBaseState {
  isLoading: boolean;
  isError: boolean;
  isUpdatingDashboard: boolean;
  isAddingPanel: boolean;
  isRemovingPanel: boolean;
  isUpdatingLayout: boolean;
  isSavingLayout: boolean;
  isUpdateDashboardError: boolean;
  isAddPanelError: boolean;
  isRemovePanelError: boolean;
  isUpdateLayoutError: boolean;
  isSaveLayoutError: boolean;
  hasUnsavedChanges: boolean;
  localLayout: Layouts;
  isAddPanelDialogOpen: boolean;
}

export interface SeedarDashboardActions {
  updateDashboard: (data: UpdateDashboardRequest) => void;
  addPanel: (panelId: string, options?: AddPanelDialogOptions) => void;
  removePanel: (panelId: string) => void;
  updateLayout: (layout: Layouts) => void;
  saveLayout: () => void;
  cancelChanges: () => void;
  openAddPanelDialog: () => void;
  closeAddPanelDialog: () => void;
  setActiveBreakpoint: (breakpoint: SeedarBreakpoint) => void;
  setLockedCanvasWidth: (width: number) => void;
  copyActiveBreakpointToOthers: () => void;
}

export interface SeedarDashboardState extends SeedarDashboardBaseState {
  activeBreakpoint: SeedarBreakpoint;
  containerBreakpoint: SeedarBreakpoint;
  containerWidth: number;
  effectiveGridWidth: number;
  lockedCanvasWidth: number;
  configuredBreakpoints: SeedarBreakpoint[];
  activeBreakpointSource: SeedarBreakpoint | null;
}

export interface SeedarDashboardContextValue {
  dashboardId: string;
  data: DashboardResponse | undefined;
  mode: "edit" | "view";
  actions: SeedarDashboardActions;
  state: SeedarDashboardState;
}
