import {
  CARTESIAN_CHART_TYPES,
  CHART_FIELD_CONFIGS,
  type AxisItemConfig,
  type ChartType,
  type DisplayPanelType,
  type PanelEditorConfig,
} from "./types";

export const CHART_EDITOR_MODE_KEY = "__seedarEditorMode";
export const CHART_EDITOR_ADVANCED_SPEC_KEY = "__seedarAdvancedSpec";
export const CHART_EDITOR_MODE_ADVANCED = "advanced";

export const SUPPORTED_CHART_SPEC_TYPES = Object.keys(
  CHART_FIELD_CONFIGS,
) as ChartType[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stripChartEditorMeta = (
  spec: Record<string, unknown>,
): Record<string, unknown> => {
  const nextSpec = { ...spec };
  delete nextSpec[CHART_EDITOR_MODE_KEY];
  delete nextSpec[CHART_EDITOR_ADVANCED_SPEC_KEY];
  return nextSpec;
};

const COMMON_FIELD_MAPPING_KEYS: Array<keyof PanelEditorConfig> = [
  "xField",
  "yField",
  "seriesField",
  "categoryField",
  "valueField",
  "sizeField",
];

const appendFieldMappings = (
  targetSpec: Record<string, unknown>,
  editorConfig: PanelEditorConfig,
  keys: Array<keyof PanelEditorConfig>,
) => {
  keys.forEach((key) => {
    if (targetSpec[key] !== undefined) {
      return;
    }

    const value = editorConfig[key];
    if (typeof value === "string" && value.trim()) {
      targetSpec[key] = value;
    }
  });
};

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

const normalizeAdvancedSpec = (
  displayType: DisplayPanelType,
  editorConfig: PanelEditorConfig,
): Record<string, unknown> | undefined => {
  if (!isRecord(editorConfig.advancedSpec)) {
    return undefined;
  }

  const spec = stripChartEditorMeta({
    ...editorConfig.advancedSpec,
  });
  // formatting 不应由高级 spec 编辑器控制，统一由外层配置维护。
  delete spec.formatting;

  if (!spec.type) {
    spec.type = displayType;
  }

  appendFieldMappings(spec, editorConfig, COMMON_FIELD_MAPPING_KEYS);

  if (editorConfig.formatting) {
    spec.formatting = editorConfig.formatting;
  }

  return spec;
};

export const buildChartSpecFromEditorConfig = (
  displayType: DisplayPanelType,
  editorConfig: PanelEditorConfig,
): Record<string, unknown> | undefined => {
  if (displayType === "table" || displayType === "card") {
    return undefined;
  }

  if (editorConfig.isAdvancedSpecMode) {
    const advancedSpec = normalizeAdvancedSpec(displayType, editorConfig);
    if (advancedSpec) {
      return advancedSpec;
    }
  }

  const baseSpec: Record<string, unknown> = {
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
    appendFieldMappings(
      baseSpec,
      editorConfig,
      allFields as Array<keyof PanelEditorConfig>,
    );
  } else {
    // 未内置适配的图表类型仍保留通用字段映射，避免预览时字段被丢失。
    appendFieldMappings(baseSpec, editorConfig, COMMON_FIELD_MAPPING_KEYS);
  }

  return baseSpec;
};

export const buildPersistedChartConfig = (
  displayType: DisplayPanelType,
  editorConfig: PanelEditorConfig,
): Record<string, unknown> | undefined => {
  const spec = buildChartSpecFromEditorConfig(displayType, editorConfig);
  if (!spec) {
    return undefined;
  }

  const nextSpec = stripChartEditorMeta(spec);

  if (editorConfig.isAdvancedSpecMode && isRecord(editorConfig.advancedSpec)) {
    nextSpec[CHART_EDITOR_MODE_KEY] = CHART_EDITOR_MODE_ADVANCED;
    nextSpec[CHART_EDITOR_ADVANCED_SPEC_KEY] = stripChartEditorMeta({
      ...editorConfig.advancedSpec,
    });
  }

  return nextSpec;
};
