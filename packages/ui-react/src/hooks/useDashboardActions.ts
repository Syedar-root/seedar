import {
  useUpdateDashboard,
  useAddPanel,
  useRemovePanel,
  useUpdateLayout,
} from './useDashboard';
import type { UpdateDashboardRequest, Layouts } from '#pkg/seedar/types';

interface UseDashboardActionsReturn {
  actions: {
    updateDashboard: (data: UpdateDashboardRequest) => void;
    addPanel: (panelId: string) => void;
    removePanel: (panelId: string) => void;
    updateLayout: (layout: Layouts) => void;
  };
  state: {
    isUpdatingDashboard: boolean;
    isAddingPanel: boolean;
    isRemovingPanel: boolean;
    isUpdatingLayout: boolean;
    isUpdateDashboardError: boolean;
    isAddPanelError: boolean;
    isRemovePanelError: boolean;
    isUpdateLayoutError: boolean;
  };
}

export const useDashboardActions = (
  dashboardId: string,
): UseDashboardActionsReturn => {
  const updateDashboard = useUpdateDashboard();
  const addPanel = useAddPanel();
  const removePanel = useRemovePanel();
  const updateLayout = useUpdateLayout();

  return {
    actions: {
      updateDashboard: (data: UpdateDashboardRequest) =>
        updateDashboard.mutate({ id: dashboardId, data }),
      addPanel: (panelId: string) =>
        addPanel.mutate({ id: dashboardId, panelId }),
      removePanel: (panelId: string) =>
        removePanel.mutate({ id: dashboardId, panelId }),
      updateLayout: (layout: Layouts) =>
        updateLayout.mutate({ id: dashboardId, layout }),
    },
    state: {
      isUpdatingDashboard: updateDashboard.isPending,
      isAddingPanel: addPanel.isPending,
      isRemovingPanel: removePanel.isPending,
      isUpdatingLayout: updateLayout.isPending,
      isUpdateDashboardError: updateDashboard.isError,
      isAddPanelError: addPanel.isError,
      isRemovePanelError: removePanel.isError,
      isUpdateLayoutError: updateLayout.isError,
    },
  };
};
