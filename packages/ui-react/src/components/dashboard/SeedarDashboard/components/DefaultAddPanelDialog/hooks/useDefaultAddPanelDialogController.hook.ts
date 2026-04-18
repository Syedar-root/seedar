import { useCallback, useMemo, useState } from "react";

import { usePanels } from "../../../../../../hooks";
import {
  DEFAULT_H,
  DEFAULT_W,
  type AddPanelScope,
} from "../../../../../../utils/dashboard-layout/constants";
import { getBreakpointSummaryLabel } from "../../../../../../utils/dashboard-layout/layoutEditor";
import { useSeedarDashboardContext } from "../../../context/SeedarDashboardContext";
import type { DefaultAddPanelDialogProps } from "../types";

export const useDefaultAddPanelDialogController = ({
  onClose,
}: DefaultAddPanelDialogProps) => {
  const { actions, data, state } = useSeedarDashboardContext();
  const { data: panels, isLoading } = usePanels();
  const [selectedPanelId, setSelectedPanelId] = useState("");
  const [scope, setScope] = useState<AddPanelScope>("active");

  const existingPanelIds = useMemo(
    () => new Set((data?.panels || []).map((panel: { id: string }) => panel.id)),
    [data?.panels],
  );

  const activeBreakpointLabel = useMemo(
    () => getBreakpointSummaryLabel(state.activeBreakpoint),
    [state.activeBreakpoint],
  );

  const handlePanelSelect = useCallback(() => {
    if (!selectedPanelId) {
      return;
    }

    actions.addPanel(selectedPanelId, {
      defaultSize: { w: DEFAULT_W, h: DEFAULT_H },
      scope,
    });
    onClose();
  }, [actions, onClose, scope, selectedPanelId]);

  return {
    activeBreakpointLabel,
    existingPanelIds,
    handlePanelSelect,
    isLoading,
    panels,
    scope,
    selectedPanelId,
    setScope,
    setSelectedPanelId,
  };
};
