import { useMemo } from "react";

import { useSeedarDashboardContext } from "../context/SeedarDashboardContext";

export const useSaveTriggerRenderProps = () => {
  const { actions, state, mode } = useSeedarDashboardContext();

  return useMemo(() => {
    if (mode === "view") {
      return null;
    }

    return {
      disabled: !state.hasUnsavedChanges || state.isSavingLayout,
      hasUnsavedChanges: state.hasUnsavedChanges,
      isSaving: state.isSavingLayout,
      onClick: () => {
        if (!state.isSavingLayout && state.hasUnsavedChanges) {
          actions.saveLayout();
        }
      },
    };
  }, [actions, mode, state.hasUnsavedChanges, state.isSavingLayout]);
};

export const useCancelTriggerRenderProps = () => {
  const { actions, state, mode } = useSeedarDashboardContext();

  return useMemo(() => {
    if (mode === "view") {
      return null;
    }

    return {
      disabled: !state.hasUnsavedChanges,
      hasUnsavedChanges: state.hasUnsavedChanges,
      onClick: () => {
        if (state.hasUnsavedChanges) {
          actions.cancelChanges();
        }
      },
    };
  }, [actions, mode, state.hasUnsavedChanges]);
};

export const useRemovePanelTriggerRenderProps = (panelId: string) => {
  const { actions, state, mode } = useSeedarDashboardContext();

  return useMemo(() => {
    if (mode === "view") {
      return null;
    }

    return {
      disabled: state.isRemovingPanel,
      isRemoving: state.isRemovingPanel,
      onClick: () => {
        if (!state.isRemovingPanel) {
          actions.removePanel(panelId);
        }
      },
    };
  }, [actions, mode, panelId, state.isRemovingPanel]);
};

export const useAddPanelTriggerRenderProps = () => {
  const { actions, state, mode } = useSeedarDashboardContext();

  return useMemo(() => {
    if (mode === "view") {
      return null;
    }

    return {
      isDialogOpen: state.isAddPanelDialogOpen,
      onClick: () => {
        actions.openAddPanelDialog();
      },
      onClose: actions.closeAddPanelDialog,
    };
  }, [actions, mode, state.isAddPanelDialogOpen]);
};
