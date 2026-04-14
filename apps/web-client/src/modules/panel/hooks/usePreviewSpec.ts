import { useMemo } from "react";
import {
  CARTESIAN_CHART_TYPES,
  DisplayPanelType,
  PanelEditorConfig,
  ChartType,
  CHART_FIELD_CONFIGS,
  type AxisItemConfig,
} from "../components/panelEditor";

const toAxisSpec = (
  orient: "bottom" | "left",
  config: AxisItemConfig,
): Record<string, unknown> => {
  const labelSpec: Record<string, unknown> = { visible: config.labelVisible };

  if (typeof config.labelRotate === "number") {
    labelSpec.style = { angle: config.labelRotate };
  }

  const axisSpec: Record<string, unknown> = {
    orient,
    visible: config.visible,
    label: labelSpec,
    tick: { visible: config.tickVisible },
    grid: { visible: config.gridVisible },
  };

  if (config.scaleType === "log") {
    axisSpec.type = "log";
    if (
      typeof config.logBase === "number" &&
      Number.isFinite(config.logBase) &&
      config.logBase > 0 &&
      config.logBase !== 1
    ) {
      axisSpec.base = config.logBase;
    }
  }

  if (typeof config.min === "number" && Number.isFinite(config.min)) {
    axisSpec.min = config.min;
  }

  if (typeof config.max === "number" && Number.isFinite(config.max)) {
    axisSpec.max = config.max;
  }

  if (typeof config.nice === "boolean") {
    axisSpec.nice = config.nice;
  }

  if (config.title) {
    axisSpec.title = { visible: true, text: config.title };
  }

  if (
    orient === "left" &&
    config.scaleType !== "log" &&
    typeof config.zero === "boolean"
  ) {
    axisSpec.zero = config.zero;
  }

  return axisSpec;
};

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

    if (displayType === "line" && typeof editorConfig.smooth === "boolean") {
      baseSpec.line = {
        style: {
          curveType: editorConfig.smooth ? "monotone" : "linear",
        },
      };
    }

    if (displayType === "bar" && editorConfig.direction) {
      baseSpec.direction = editorConfig.direction;
    }

    if (
      editorConfig.axis &&
      CARTESIAN_CHART_TYPES.includes(displayType as ChartType)
    ) {
      baseSpec.axes = [
        toAxisSpec("bottom", editorConfig.axis.x),
        toAxisSpec("left", editorConfig.axis.y),
      ];
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
