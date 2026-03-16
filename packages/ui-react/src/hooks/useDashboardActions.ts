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
  const [isAddPanelDialogOpen, setIsAddPanelDialogOpen] = useState(false);

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

  const handleOpenAddPanelDialog = () => {
    setIsAddPanelDialogOpen(true);
  };

  const handleCloseAddPanelDialog = () => {
    setIsAddPanelDialogOpen(false);
  };

  const handleAddPanel = (panelId: string) => {
    addPanel.mutate(
      { id: dashboardId, panelId },
      {
        onSuccess: (responseData) => {
          const panel = responseData.panels.find((p) => p.id === panelId);
          if (!panel) return;

          const defaultWidth = panel.width || 6;
          const defaultHeight = panel.height || 4;

          const newLayoutItem = {
            i: panelId,
            x: 0,
            y: 0,
            w: defaultWidth,
            h: defaultHeight,
          };

          const updatedLayout: Layouts = {};
          const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'] as const;

          breakpoints.forEach((breakpoint) => {
            const currentItems = localLayout[breakpoint] || [];
            const maxY =
              currentItems.length > 0
                ? Math.max(...currentItems.map((item) => item.y + item.h))
                : 0;
            updatedLayout[breakpoint] = [
              ...currentItems,
              {
                ...newLayoutItem,
                y: maxY,
              },
            ];
          });

          if (autoUpdate) {
            updateLayout.mutate({ id: dashboardId, layout: updatedLayout });
          } else {
            setLocalLayout(updatedLayout);
          }
        },
      }
    );
  };

  return {
    data,
    actions: {
      updateDashboard: (data: UpdateDashboardRequest) =>
        updateDashboard.mutate({ id: dashboardId, data }),
      addPanel: handleAddPanel,
      removePanel: (panelId: string) =>
        removePanel.mutate({ id: dashboardId, panelId }),
      updateLayout: handleUpdateLayout,
      saveLayout: handleSaveLayout,
      cancelChanges: handleCancelChanges,
      openAddPanelDialog: handleOpenAddPanelDialog,
      closeAddPanelDialog: handleCloseAddPanelDialog,
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
      isAddPanelDialogOpen,
    },
  };
};
