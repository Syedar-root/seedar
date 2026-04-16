import { createContext, useContext } from "react";

import type {
  DashboardResponse,
  Layouts,
  UpdateDashboardRequest,
} from "#pkg/seedar/types";

import type {
  AddPanelScope,
  SeedarBreakpoint,
} from "../../../../utils/dashboard-layout/constants";

interface AddPanelDialogOptions {
  defaultSize?: { w: number; h: number };
  scope?: AddPanelScope;
}

interface SeedarDashboardContextValue {
  dashboardId: string;
  data: DashboardResponse | undefined;
  mode: "edit" | "view";
  actions: {
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
  };
  state: {
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
    activeBreakpoint: SeedarBreakpoint;
    containerBreakpoint: SeedarBreakpoint;
    containerWidth: number;
    effectiveGridWidth: number;
    lockedCanvasWidth: number;
    configuredBreakpoints: SeedarBreakpoint[];
    activeBreakpointSource: SeedarBreakpoint | null;
  };
}

export const SeedarDashboardContext =
  createContext<SeedarDashboardContextValue | null>(null);

export const useSeedarDashboardContext = () => {
  const context = useContext(SeedarDashboardContext);
  if (!context) {
    throw new Error(
      "useSeedarDashboardContext must be used within SeedarDashboard",
    );
  }
  return context;
};
