import { FieldType, type DatasetResponse } from "#pkg/seedar/types";
import {
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type {
  DragItem,
  FilterItem,
  LocalPanelStatus,
  DimensionItem,
  SortItem,
  TempMetricConfig,
  TitleConfig,
} from "../types";
import type { PanelResponse, QueryResponse } from "#pkg/seedar/types";
import {
  createDefaultAxisConfig,
  DEFAULT_COLORS,
  DEFAULT_LEGENDS_CONFIG,
  DEFAULT_PANEL_FORMATTING_CONFIG,
  type AxisConfig,
  type ChartType,
  type DisplayPanelType,
  type PanelEditorConfig,
} from "../components/panelEditor";
import {
  CHART_EDITOR_ADVANCED_SPEC_KEY,
  CHART_EDITOR_MODE_ADVANCED,
  CHART_EDITOR_MODE_KEY,
  SUPPORTED_CHART_SPEC_TYPES,
} from "../components/panelEditor/chartSpec";
import {
  hydrateDimensions,
  mapPanelTypeToDisplayType,
  stripChartEditorMeta,
  VISUAL_CHART_SPEC_KEYS,
} from "../utils/panelEditorState";
import {
  buildSortCandidates,
  hydrateSortItems,
} from "../utils/querySort";

interface UsePanelEditorHydrationParams {
  panelId?: string;
  panelData?: PanelResponse;
  queryData?: QueryResponse;
  remoteDatasetData?: DatasetResponse;
  hydratedQueryRef: MutableRefObject<string | undefined>;
  setPanelStatus: Dispatch<SetStateAction<LocalPanelStatus>>;
  setTitle: Dispatch<SetStateAction<string>>;
  setTitleConfig: Dispatch<SetStateAction<TitleConfig | undefined>>;
  setDisplayType: Dispatch<SetStateAction<DisplayPanelType>>;
  setEditorConfig: Dispatch<SetStateAction<PanelEditorConfig>>;
  setSelectedDataset: Dispatch<SetStateAction<DatasetResponse | undefined>>;
  setDimensionItems: Dispatch<SetStateAction<DimensionItem[]>>;
  setDropMetrics: Dispatch<SetStateAction<DragItem[]>>;
  setDropFilters: Dispatch<SetStateAction<FilterItem[]>>;
  setTempMetrics: Dispatch<SetStateAction<TempMetricConfig[]>>;
  setSortItems: Dispatch<SetStateAction<SortItem[]>>;
  setTopN: Dispatch<SetStateAction<number | undefined>>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const parseChartSmooth = (
  chartSpec: Record<string, unknown>,
): boolean | undefined => {
  const line = chartSpec.line;
  if (!isRecord(line)) {
    return undefined;
  }

  const style = line.style;
  if (!isRecord(style)) {
    return undefined;
  }

  const curveType = style.curveType;
  if (curveType === "monotone") {
    return true;
  }

  if (curveType === "linear") {
    return false;
  }

  return undefined;
};

const parseChartAxis = (
  chartSpec: Record<string, unknown>,
): AxisConfig | undefined => {
  const axes = chartSpec.axes;
  if (!Array.isArray(axes)) {
    return undefined;
  }

  const nextAxis = createDefaultAxisConfig();
  let hasMappedAxis = false;

  axes.forEach((axisSpec) => {
    if (!isRecord(axisSpec)) {
      return;
    }

    const orient = axisSpec.orient;
    const axisKey = orient === "bottom" ? "x" : orient === "left" ? "y" : null;
    if (!axisKey) {
      return;
    }

    hasMappedAxis = true;
    const axisTarget = nextAxis[axisKey];

    if (typeof axisSpec.visible === "boolean") {
      axisTarget.visible = axisSpec.visible;
    }

    const label = axisSpec.label;
    if (isRecord(label)) {
      if (typeof label.visible === "boolean") {
        axisTarget.labelVisible = label.visible;
      }

      const style = label.style;
      if (isRecord(style) && typeof style.angle === "number") {
        axisTarget.labelRotate = style.angle;
      }
    }

    const tick = axisSpec.tick;
    if (isRecord(tick) && typeof tick.visible === "boolean") {
      axisTarget.tickVisible = tick.visible;
    }

    const grid = axisSpec.grid;
    if (isRecord(grid) && typeof grid.visible === "boolean") {
      axisTarget.gridVisible = grid.visible;
    }

    if (axisSpec.type === "log") {
      axisTarget.scaleType = "log";
    } else if (axisSpec.type === "linear") {
      axisTarget.scaleType = "linear";
    }

    if (typeof axisSpec.base === "number") {
      axisTarget.logBase = axisSpec.base;
    }

    if (typeof axisSpec.min === "number") {
      axisTarget.min = axisSpec.min;
    }

    if (typeof axisSpec.max === "number") {
      axisTarget.max = axisSpec.max;
    }

    if (typeof axisSpec.nice === "boolean") {
      axisTarget.nice = axisSpec.nice;
    }

    if (typeof axisSpec.zero === "boolean") {
      axisTarget.zero = axisSpec.zero;
    }

    const title = axisSpec.title;
    if (typeof title === "string") {
      axisTarget.title = title;
    } else if (isRecord(title) && typeof title.text === "string") {
      axisTarget.title = title.text;
    }
  });

  return hasMappedAxis ? nextAxis : undefined;
};

const hydrateChartEditorConfig = (
  chartSpec: Record<string, unknown>,
): Partial<PanelEditorConfig> => {
  const nextConfig: Partial<PanelEditorConfig> = {};
  const mappingKeys: Array<keyof PanelEditorConfig> = [
    "xField",
    "yField",
    "seriesField",
    "categoryField",
    "valueField",
    "sizeField",
  ];

  mappingKeys.forEach((key) => {
    const value = chartSpec[key];
    if (typeof value === "string") {
      (nextConfig as Record<string, unknown>)[key] = value;
    }
  });

  if (
    typeof chartSpec.type === "string" &&
    SUPPORTED_CHART_SPEC_TYPES.includes(chartSpec.type as ChartType)
  ) {
    nextConfig.type = chartSpec.type as ChartType;
  }

  if (
    typeof chartSpec.direction === "string" &&
    (chartSpec.direction === "vertical" || chartSpec.direction === "horizontal")
  ) {
    nextConfig.direction = chartSpec.direction;
  }

  if (Array.isArray(chartSpec.color)) {
    const color = chartSpec.color.filter(
      (entry): entry is string => typeof entry === "string",
    );
    if (color.length > 0) {
      nextConfig.color = color;
    }
  }

  const label = chartSpec.label;
  if (isRecord(label) && typeof label.visible === "boolean") {
    nextConfig.label = {
      visible: label.visible,
      sourceField:
        label.sourceField === "xField" ||
        label.sourceField === "yField" ||
        label.sourceField === "seriesField" ||
        label.sourceField === "categoryField" ||
        label.sourceField === "valueField" ||
        label.sourceField === "sizeField" ||
        label.sourceField === "auto"
          ? label.sourceField
          : undefined,
    };
  }

  const legends = chartSpec.legends;
  if (isRecord(legends)) {
    const visible =
      typeof legends.visible === "boolean" ? legends.visible : undefined;
    const orient =
      legends.orient === "left" ||
      legends.orient === "top" ||
      legends.orient === "right" ||
      legends.orient === "bottom"
        ? legends.orient
        : undefined;
    const layout =
      legends.layout === "horizontal" || legends.layout === "vertical"
        ? legends.layout
        : undefined;
    const legendTitle =
      isRecord(legends.title) && typeof legends.title.text === "string"
        ? legends.title.text
        : undefined;

    if (visible !== undefined || orient || layout || legendTitle) {
      nextConfig.legends = {
        visible: visible ?? DEFAULT_LEGENDS_CONFIG.visible,
        orient: orient ?? DEFAULT_LEGENDS_CONFIG.orient,
        layout: layout ?? DEFAULT_LEGENDS_CONFIG.layout,
        title: legendTitle,
      };
    }
  }

  const smooth = parseChartSmooth(chartSpec);
  if (typeof smooth === "boolean") {
    nextConfig.smooth = smooth;
  }

  const axis = parseChartAxis(chartSpec);
  if (axis) {
    nextConfig.axis = axis;
  }

  return nextConfig;
};

export const usePanelEditorHydration = ({
  panelId,
  panelData,
  queryData,
  remoteDatasetData,
  hydratedQueryRef,
  setPanelStatus,
  setTitle,
  setTitleConfig,
  setDisplayType,
  setEditorConfig,
  setSelectedDataset,
  setDimensionItems,
  setDropMetrics,
  setDropFilters,
  setTempMetrics,
  setSortItems,
  setTopN,
}: UsePanelEditorHydrationParams): void => {
  useEffect(() => {
    if (!panelId) {
      setPanelStatus("unsaved");
      hydratedQueryRef.current = undefined;
      return;
    }

    if (panelData?.status) {
      setPanelStatus(panelData.status);
    }
  }, [hydratedQueryRef, panelData?.status, panelId, setPanelStatus]);

  useEffect(() => {
    if (!panelData) {
      return;
    }

    if (panelData.title) {
      setTitle(panelData.title);
    }

    if (panelData.titleConfig) {
      setTitleConfig(panelData.titleConfig as TitleConfig);
    }

    setDisplayType(mapPanelTypeToDisplayType(panelData));

    const panelConfig =
      (panelData.config as PanelEditorConfig | undefined) ?? {};
    const rawChartSpec = (panelData.config as Record<string, unknown>) ?? {};
    const cleanedRawChartSpec = stripChartEditorMeta(rawChartSpec);
    const hydratedChartConfig =
      panelData.type === "chart"
        ? hydrateChartEditorConfig(cleanedRawChartSpec)
        : undefined;
    const rawChartType = rawChartSpec.type;
    const hasCustomChartType =
      panelData.type === "chart" &&
      typeof rawChartType === "string" &&
      !SUPPORTED_CHART_SPEC_TYPES.includes(rawChartType as ChartType);

    const persistedMode = rawChartSpec[CHART_EDITOR_MODE_KEY];
    const persistedAdvancedSpec = rawChartSpec[CHART_EDITOR_ADVANCED_SPEC_KEY];
    const hasPersistedAdvancedMode =
      panelData.type === "chart" &&
      persistedMode === CHART_EDITOR_MODE_ADVANCED &&
      typeof persistedAdvancedSpec === "object" &&
      persistedAdvancedSpec !== null;

    const hasUnknownVisualKeys =
      panelData.type === "chart" &&
      Object.keys(cleanedRawChartSpec).some(
        (key) => !VISUAL_CHART_SPEC_KEYS.has(key),
      );

    const shouldUseAdvancedMode =
      hasPersistedAdvancedMode || hasCustomChartType || hasUnknownVisualKeys;

    const advancedSpec = hasPersistedAdvancedMode
      ? stripChartEditorMeta(persistedAdvancedSpec as Record<string, unknown>)
      : cleanedRawChartSpec;

    const sanitizedPanelConfig = { ...panelConfig } as Record<string, unknown>;
    delete sanitizedPanelConfig[CHART_EDITOR_MODE_KEY];
    delete sanitizedPanelConfig[CHART_EDITOR_ADVANCED_SPEC_KEY];
    delete sanitizedPanelConfig.line;
    delete sanitizedPanelConfig.axes;

    setEditorConfig({
      ...(sanitizedPanelConfig as PanelEditorConfig),
      ...(hydratedChartConfig ?? {}),
      ...(hasCustomChartType ? { type: "line" as ChartType } : {}),
      ...(shouldUseAdvancedMode
        ? {
            isAdvancedSpecMode: true,
            advancedSpec,
          }
        : {}),
      color: hydratedChartConfig?.color || panelConfig.color || DEFAULT_COLORS,
      legends:
        hydratedChartConfig?.legends ||
        panelConfig.legends ||
        DEFAULT_LEGENDS_CONFIG,
      formatting: panelConfig.formatting || DEFAULT_PANEL_FORMATTING_CONFIG,
    });
  }, [panelData, setDisplayType, setEditorConfig, setTitle, setTitleConfig]);

  useEffect(() => {
    if (!queryData || !remoteDatasetData) {
      return;
    }

    if (hydratedQueryRef.current === queryData.id) {
      return;
    }

    setSelectedDataset(remoteDatasetData);
    const nextDimensionItems = hydrateDimensions(
      queryData.dsl?.dimensions,
      remoteDatasetData.fields,
    );
    setDimensionItems(nextDimensionItems);

    const nextMetrics = (
      (queryData.dsl?.metrics as Array<{ id: number }> | undefined) ?? []
    )
      .map((metric) =>
        remoteDatasetData.metrics.find((item) => item.id === metric.id),
      )
      .filter((metric): metric is NonNullable<typeof metric> => Boolean(metric))
      .map((metric) => ({ ...metric }) as DragItem);
    setDropMetrics(nextMetrics);

    const nextFilters = (
      (queryData.dsl?.filters as
        | Array<{ fieldId: number; op: string; value?: unknown }>
        | undefined) ?? []
    ).map((filter, index) => {
      const field = remoteDatasetData.fields.find(
        (item) => item.id === filter.fieldId,
      );
      return {
        id: `filter_${filter.fieldId}_${index}`,
        fieldId: filter.fieldId,
        name: field?.businessName || field?.name || `field_${filter.fieldId}`,
        fieldType: field?.type ?? FieldType.STRING,
        op: filter.op,
        value: filter.value,
      };
    });
    setDropFilters(nextFilters);

    const nextTempMetrics =
      (queryData.dsl?.tempMetrics as TempMetricConfig[] | undefined) ?? [];
    setTempMetrics(nextTempMetrics);

    const nextSortCandidates = buildSortCandidates({
      dimensions: nextDimensionItems,
      metrics: nextMetrics,
      tempMetrics: nextTempMetrics,
    });
    setSortItems(
      hydrateSortItems(queryData.dsl?.orderBy, nextSortCandidates),
    );

    const persistedTopN =
      typeof queryData.dsl?.topN === "number"
        ? queryData.dsl.topN
        : queryData.dsl?.offset
          ? undefined
          : queryData.dsl?.limit;
    setTopN(
      nextSortCandidates.length > 0 &&
        typeof persistedTopN === "number" &&
        persistedTopN > 0
        ? persistedTopN
        : undefined,
    );

    hydratedQueryRef.current = queryData.id;
  }, [
    hydratedQueryRef,
    queryData,
    remoteDatasetData,
    setDimensionItems,
    setDropFilters,
    setDropMetrics,
    setSelectedDataset,
    setSortItems,
    setTopN,
    setTempMetrics,
  ]);
};
