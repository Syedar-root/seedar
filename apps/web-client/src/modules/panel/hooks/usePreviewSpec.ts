import { useMemo } from "react";
import {
  DisplayPanelType,
  PanelEditorConfig,
  ChartType,
  CHART_FIELD_CONFIGS,
} from "../components/panelEditor";

export const usePreviewSpec = (
  displayType: DisplayPanelType,
  editorConfig: PanelEditorConfig,
) => {
  return useMemo(() => {
    if (displayType === "table" || displayType === "card") return undefined;

    const baseSpec: any = {
      type: displayType,
    };

    if (editorConfig.color?.length) {
      baseSpec.color = editorConfig.color;
    }

    if (editorConfig.label?.visible) {
      baseSpec.label = { visible: true };
    }

    if (editorConfig.legends?.visible) {
      baseSpec.legends = {
        visible: true,
        orient: editorConfig.legends.orient,
        layout: editorConfig.legends.layout,
        ...(editorConfig.legends.title && {
          title: { visible: true, text: editorConfig.legends.title },
        }),
      };
    }

    if (editorConfig.formatting) {
      baseSpec.formatting = editorConfig.formatting;
    }

    const fieldConfig = CHART_FIELD_CONFIGS[displayType as ChartType];
    if (fieldConfig) {
      const allFields = [...fieldConfig.required, ...fieldConfig.optional];
      allFields.forEach((field) => {
        const value = editorConfig[field as keyof PanelEditorConfig];
        if (value !== undefined) {
          baseSpec[field] = value;
        }
      });
    }

    return baseSpec;
  }, [displayType, editorConfig]);
};
