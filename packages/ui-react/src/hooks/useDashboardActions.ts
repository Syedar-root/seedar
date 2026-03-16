import { useState, useEffect } from 'react';
import {
  useDashboard,
  useUpdateDashboard,
  useAddPanel,
  useRemovePanel,
  useUpdateLayout,
} from './useDashboard';
import type {
  DashboardResponse,
  UpdateDashboardRequest,
  Layouts,
} from '#pkg/seedar/types';

interface UseDashboardActionsReturn {
  data: DashboardResponse | undefined;
  actions: {
    updateDashboard: (data: UpdateDashboardRequest) => void;
    addPanel: (panelId: string) => void;
    removePanel: (panelId: string) => void;
    updateLayout: (layout: Layouts) => void;
    saveLayout: () => void;
    cancelChanges: () => void;
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
  };
}

export const useDashboardActions = (
  dashboardId: string,
  autoUpdate: boolean = false
): UseDashboardActionsReturn => {
  const { data, isPending, isError } = useDashboard(dashboardId);
  const updateDashboard = useUpdateDashboard();
  const addPanel = useAddPanel();
  const removePanel = useRemovePanel();
  const updateLayout = useUpdateLayout();

  const [localLayout, setLocalLayout] = useState<Layouts>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (data?.layout) {
      setLocalLayout(data.layout);
      setHasUnsavedChanges(false);
    }
  }, [data?.layout]);

  useEffect(() => {
    if (data?.layout) {
      const hasChanges =
        JSON.stringify(localLayout) !== JSON.stringify(data.layout);
      setHasUnsavedChanges(hasChanges);
    }
  }, [localLayout, data?.layout]);

  const handleUpdateLayout = (layout: Layouts) => {
    if (autoUpdate) {
      updateLayout.mutate(
        { id: dashboardId, layout },
        {
          onSuccess: (data) => {
            setLocalLayout(data.layout);
          },
        }
      );
    } else {
      setLocalLayout(layout);
    }
  };

  const handleSaveLayout = () => {
    updateLayout.mutate({ id: dashboardId, layout: localLayout });
  };

  const handleCancelChanges = () => {
    if (data?.layout) {
      setLocalLayout(data.layout);
      setHasUnsavedChanges(false);
    }
  };

  return {
    data,
    actions: {
      updateDashboard: (data: UpdateDashboardRequest) =>
        updateDashboard.mutate({ id: dashboardId, data }),
      addPanel: (panelId: string) =>
        addPanel.mutate({ id: dashboardId, panelId }),
      removePanel: (panelId: string) =>
        removePanel.mutate({ id: dashboardId, panelId }),
      updateLayout: handleUpdateLayout,
      saveLayout: handleSaveLayout,
      cancelChanges: handleCancelChanges,
    },
    state: {
      isLoading: isPending,
      isError: isError,
      isUpdatingDashboard: updateDashboard.isPending,
      isAddingPanel: addPanel.isPending,
      isRemovingPanel: removePanel.isPending,
      isUpdatingLayout: updateLayout.isPending,
      isSavingLayout: updateLayout.isPending,
      isUpdateDashboardError: updateDashboard.isError,
      isAddPanelError: addPanel.isError,
      isRemovePanelError: removePanel.isError,
      isUpdateLayoutError: updateLayout.isError,
      isSaveLayoutError: updateLayout.isError,
      hasUnsavedChanges,
      localLayout,
    },
  };
};
