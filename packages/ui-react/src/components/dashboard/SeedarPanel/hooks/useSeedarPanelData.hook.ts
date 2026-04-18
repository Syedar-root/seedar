import { useMemo } from "react";

import { usePanel } from "../../../../hooks";
import type { SeedarPanelDataState, SeedarPanelProps } from "../types";

export const useSeedarPanelData = ({
  panel,
  panelId,
}: Pick<SeedarPanelProps, "panel" | "panelId">): SeedarPanelDataState => {
  const { data: panelData, isPending, isError } = usePanel(panelId, !panel);

  return useMemo(
    () => ({
      finalPanel: panel || panelData,
      isPending,
      isError,
    }),
    [isError, isPending, panel, panelData],
  );
};
