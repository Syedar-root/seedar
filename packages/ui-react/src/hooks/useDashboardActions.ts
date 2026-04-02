import { useState, useEffect } from "react";
import {
  useDashboard,
  useUpdateDashboard,
  useAddPanel,
  useRemovePanel,
  useUpdateLayout,
} from "./useDashboard";
import type {
  DashboardResponse,
  UpdateDashboardRequest,
  Layouts,
  LayoutItem,
} from "#pkg/seedar/types";

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
  autoUpdate: boolean = false,
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
    return () => {
      setLocalLayout({});
      setHasUnsavedChanges(false);
    };
  }, [data?.layout, dashboardId]);

  useEffect(() => {
    if (data?.layout) {
      const hasChanges =
        JSON.stringify(localLayout) !== JSON.stringify(data.layout);
      setHasUnsavedChanges(hasChanges);
    }
  }, [localLayout, data?.layout]);

  const handleUpdateLayout = (layout: Layouts) => {
    // 验证是否有重复的 i
    const breakpoints = ["lg", "md", "sm", "xs", "xxs"] as const;
    breakpoints.forEach((b) => {
      if (layout[b]) {
        const seen = new Map<string, LayoutItem>();
        layout[b].forEach((item) => {
          seen.set(item.i, item);
        });
        layout[b] = Array.from(seen.values());
      }
    });

    if (autoUpdate) {
      updateLayout.mutate(
        { id: dashboardId, layout },
        {
          onSuccess: (data) => {
            setLocalLayout(data.layout || {});
          },
        },
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

  const handleAddPanel = (
    panelId: string,
    defaultSize?: { w: number; h: number },
  ) => {
    addPanel.mutate(
      { id: dashboardId, panelId },
      {
        onSuccess: () => {
          const defaultWidth = defaultSize?.w || 6;
          const defaultHeight = defaultSize?.h || 4;

          const newLayoutItem = {
            i: panelId,
            x: 0,
            y: 0,
            w: defaultWidth,
            h: defaultHeight,
            minW: 3,
            minH: 3,
          };

          const updatedLayout: Layouts = {};
          const breakpoints = ["lg", "md", "sm", "xs", "xxs"] as const;

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

          handleUpdateLayout(updatedLayout);
        },
      },
    );
  };

  const handleRemovePanel = (panelId: string) => {
    removePanel.mutate(
      { id: dashboardId, panelId },
      {
        onSuccess: () => {
          const updatedLayout: Layouts = {};
          const breakpoints = ["lg", "md", "sm", "xs", "xxs"] as const;

          breakpoints.forEach((breakpoint) => {
            const currentItems = localLayout[breakpoint] || [];
            updatedLayout[breakpoint] = currentItems.filter(
              (item) => item.i !== panelId,
            );
          });

          handleUpdateLayout(updatedLayout);
        },
      },
    );
  };

  return {
    data,
    actions: {
      updateDashboard: (data: UpdateDashboardRequest) =>
        updateDashboard.mutate({ id: dashboardId, data }),
      addPanel: handleAddPanel,
      removePanel: handleRemovePanel,
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
