import { createContext, useContext } from 'react';
import type { DashboardResponse, Layouts } from '#pkg/seedar/types';

interface SeedarDashboardContextValue {
  dashboardId: string;
  data: DashboardResponse | undefined;
  mode: 'edit' | 'view';
  actions: {
    updateDashboard: (data: any) => void;
    addPanel: (panelId: string, min?: { w: number; h: number }) => void;
    removePanel: (panelId: string) => void;
    updateLayout: (layout: Layouts) => void;
    saveLayout: () => void;
    cancelChanges: () => void;
    openAddPanelDialog: () => void;
    closeAddPanelDialog: () => void;
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
  };
}

export const SeedarDashboardContext =
  createContext<SeedarDashboardContextValue | null>(null);

export const useSeedarDashboardContext = () => {
  const context = useContext(SeedarDashboardContext);
  if (!context) {
    throw new Error(
      'useSeedarDashboardContext must be used within SeedarDashboard'
    );
  }
  return context;
};
