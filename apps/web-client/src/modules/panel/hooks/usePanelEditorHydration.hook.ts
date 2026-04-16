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
  TempMetricConfig,
  TitleConfig,
} from "../types";
import type { PanelResponse, QueryResponse } from "#pkg/seedar/types";
import {
  DEFAULT_COLORS,
  DEFAULT_LEGENDS_CONFIG,
  DEFAULT_PANEL_FORMATTING_CONFIG,
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
}

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

    setEditorConfig({
      ...(sanitizedPanelConfig as PanelEditorConfig),
      ...(hasCustomChartType ? { type: "line" as ChartType } : {}),
      ...(shouldUseAdvancedMode
        ? {
            isAdvancedSpecMode: true,
            advancedSpec,
          }
        : {}),
      color: panelConfig.color || DEFAULT_COLORS,
      legends: panelConfig.legends || DEFAULT_LEGENDS_CONFIG,
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
    setDimensionItems(
      hydrateDimensions(queryData.dsl?.dimensions, remoteDatasetData.fields),
    );

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

    hydratedQueryRef.current = queryData.id;
  }, [
    hydratedQueryRef,
    queryData,
    remoteDatasetData,
    setDimensionItems,
    setDropFilters,
    setDropMetrics,
    setSelectedDataset,
    setTempMetrics,
  ]);
};
