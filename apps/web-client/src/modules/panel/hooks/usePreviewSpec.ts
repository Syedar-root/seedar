import { useMemo } from "react";
import {
  DisplayPanelType,
  PanelEditorConfig,
} from "../components/panelEditor";
import { buildChartSpecFromEditorConfig } from "../components/panelEditor/chartSpec";

export const usePreviewSpec = (
  displayType: DisplayPanelType,
  editorConfig: PanelEditorConfig,
) => {
  return useMemo(() => {
    return buildChartSpecFromEditorConfig(displayType, editorConfig);
  }, [displayType, editorConfig]);
};
