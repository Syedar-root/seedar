import { useEffect, useState } from "react";
import {
  useDashboard,
  useUpdateDashboard,
  useAddPanel,
  useRemovePanel,
  useUpdateLayout,
} from "./useDashboard";
import type {
  DashboardResponse,
  Layouts,
  UpdateDashboardRequest,
} from "#pkg/seedar/types";
import type { SeedarBreakpoint } from "../../utils/dashboard-layout/constants";
import { BREAKPOINT_ORDER } from "../../utils/dashboard-layout/constants";
import {
  addPanelToBreakpoints,
  normalizeLayouts,
  removePanelFromBreakpoints,
} from "../../utils/dashboard-layout/layoutEditor";

interface AddPanelOptions {
  defaultSize?: { w: number; h: number };
  targetBreakpoints?: SeedarBreakpoint[];
}

interface UseDashboardActionsReturn {
  data: DashboardResponse | undefined;
  actions: {
    updateDashboard: (data: UpdateDashboardRequest) => void;
    addPanel: (panelId: string, options?: AddPanelOptions) => void;
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
    const normalizedLayout = normalizeLayouts(layout);

    if (autoUpdate) {
      updateLayout.mutate(
        { id: dashboardId, layout: normalizedLayout },
        {
          onSuccess: (response) => {
            setLocalLayout(response.layout || {});
          },
        },
      );
      return;
    }

    setLocalLayout(normalizedLayout);
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

  const handleAddPanel = (panelId: string, options?: AddPanelOptions) => {
    addPanel.mutate(
      { id: dashboardId, panelId },
      {
        onSuccess: () => {
          handleUpdateLayout(
            addPanelToBreakpoints({
              layouts: localLayout,
              panelId,
              breakpoints:
                options?.targetBreakpoints?.length
                  ? options.targetBreakpoints
                  : BREAKPOINT_ORDER,
              defaultSize: options?.defaultSize || { w: 6, h: 4 },
            }),
          );
        },
      },
    );
  };

  const handleRemovePanel = (panelId: string) => {
    removePanel.mutate(
      { id: dashboardId, panelId },
      {
        onSuccess: () => {
          handleUpdateLayout(removePanelFromBreakpoints(localLayout, panelId));
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
      openAddPanelDialog: () => setIsAddPanelDialogOpen(true),
      closeAddPanelDialog: () => setIsAddPanelDialogOpen(false),
    },
    state: {
      isLoading: isPending,
      isError,
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
