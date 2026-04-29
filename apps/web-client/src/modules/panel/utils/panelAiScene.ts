import type { DatasetResponse, QueryDSL } from "#pkg/seedar/types";
import type { DragItem } from "../components/dndHelper/dragZone/dragZone";
import type {
  DisplayPanelType,
  PanelEditorConfig,
} from "../components/panelEditor/types";
import type { DimensionItem, TempMetricConfig } from "../types";

type PanelReadableDimensionDsl = NonNullable<QueryDSL["dimensions"]>[number];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getFieldById = (
  dataset: DatasetResponse | undefined,
  fieldId: number | undefined,
) => {
  if (!dataset || fieldId === undefined) {
    return undefined;
  }

  return dataset.fields?.find((field) => field.id === fieldId);
};

const getMetricById = (
  dataset: DatasetResponse | undefined,
  metricId: number | undefined,
) => {
  if (!dataset || metricId === undefined) {
    return undefined;
  }

  return dataset.metrics?.find((metric) => metric.id === metricId);
};

const getDisplayName = (item?: { businessName?: string; name?: string }) =>
  item?.businessName || item?.name;

const serializeDimensionDsl = (
  dimension: PanelReadableDimensionDsl,
  dataset: DatasetResponse | undefined,
) => {
  if (typeof dimension === "number") {
    const field = getFieldById(dataset, dimension);
    return {
      kind: "field",
      fieldId: dimension,
      fieldName: field?.name,
      fieldBusinessName: field?.businessName,
      displayName: getDisplayName(field) || `field_${dimension}`,
    };
  }

  if (!isRecord(dimension)) {
    return dimension;
  }

  const fieldId =
    "fieldId" in dimension && typeof dimension.fieldId === "number"
      ? dimension.fieldId
      : undefined;

  if (fieldId !== undefined) {
    const field = getFieldById(dataset, fieldId);
    const baseInfo = {
      fieldId,
      fieldName: field?.name,
      fieldBusinessName: field?.businessName,
      displayName:
        (typeof dimension.alias === "string" && dimension.alias) ||
        getDisplayName(field) ||
        `field_${fieldId}`,
    };

    if (typeof dimension.derivedKind === "string") {
      return {
        ...dimension,
        ...baseInfo,
      };
    }

    return {
      kind: "field",
      ...dimension,
      ...baseInfo,
    };
  }

  if (typeof dimension.derivedKind === "string") {
    return {
      ...dimension,
      displayName:
        (typeof dimension.alias === "string" && dimension.alias) ||
        dimension.derivedKind,
    };
  }

  return dimension;
};

const serializeMetricDsl = (
  metric: NonNullable<QueryDSL["metrics"]>[number],
  dataset: DatasetResponse | undefined,
) => {
  const sourceMetric = getMetricById(dataset, metric.id);
  return {
    id: metric.id,
    alias: metric.alias,
    name: sourceMetric?.name,
    businessName: sourceMetric?.businessName,
    displayName:
      metric.alias || getDisplayName(sourceMetric) || `metric_${metric.id}`,
  };
};

const serializeFilterDsl = (
  filter: NonNullable<QueryDSL["filters"]>[number],
  dataset: DatasetResponse | undefined,
) => {
  const field = getFieldById(dataset, filter.fieldId);
  return {
    ...filter,
    fieldName: field?.name,
    fieldBusinessName: field?.businessName,
    displayName: getDisplayName(field) || `field_${filter.fieldId}`,
  };
};

const serializeTempMetricDsl = (
  tempMetric: NonNullable<QueryDSL["tempMetrics"]>[number],
  dataset: DatasetResponse | undefined,
) => {
  const baseMetric = getMetricById(dataset, tempMetric.baseMetricId);
  const timeField = getFieldById(dataset, tempMetric.timeFieldId);

  return {
    ...tempMetric,
    baseMetricName: baseMetric?.name,
    baseMetricBusinessName: baseMetric?.businessName,
    timeFieldName: timeField?.name,
    timeFieldBusinessName: timeField?.businessName,
    displayName:
      tempMetric.businessName ||
      tempMetric.alias ||
      getDisplayName(baseMetric) ||
      tempMetric.id,
  };
};

const serializeOrderByDsl = (
  orderBy: NonNullable<QueryDSL["orderBy"]>[number],
  dataset: DatasetResponse | undefined,
) => {
  const field = getFieldById(dataset, orderBy.fieldId);
  const metric = getMetricById(dataset, orderBy.metricId);

  return {
    ...orderBy,
    fieldName: field?.name,
    fieldBusinessName: field?.businessName,
    metricName: metric?.name,
    metricBusinessName: metric?.businessName,
    displayName:
      orderBy.alias ||
      orderBy.field ||
      getDisplayName(field) ||
      getDisplayName(metric) ||
      orderBy.tempMetricId,
  };
};

const summarizeDimensionItems = (items: DimensionItem[]) =>
  items.map((item) => ({
    id: item.id,
    name: item.name,
    businessName: item.businessName,
    displayName: item.businessName || item.name,
    isDerived: item.isDerived,
    derivedKind: item.derivedKind,
    dimensionDsl: item.dimensionDsl,
  }));

const summarizeDragItems = (items: DragItem[]) =>
  items.map((item) => ({
    id: item.id,
    name: item.name,
    businessName: item.businessName,
    alias: item.alias,
    displayName: item.businessName || item.alias || item.name,
  }));

const summarizeEditorConfig = (
  displayType: DisplayPanelType,
  editorConfig: PanelEditorConfig,
) => ({
  displayType,
  chartType: editorConfig.type,
  fieldBindings: {
    xField: editorConfig.xField,
    yField: editorConfig.yField,
    seriesField: editorConfig.seriesField,
    categoryField: editorConfig.categoryField,
    valueField: editorConfig.valueField,
    sizeField: editorConfig.sizeField,
  },
  advancedSpecMode: Boolean(editorConfig.isAdvancedSpecMode),
  visualConfig: {
    smooth: editorConfig.smooth,
    direction: editorConfig.direction,
    color: editorConfig.color,
    label: editorConfig.label,
    legends: editorConfig.legends,
    axis: editorConfig.axis,
    card: editorConfig.card,
  },
});

export const serializePanelDslForAi = (
  dsl: QueryDSL | undefined,
  dataset: DatasetResponse | undefined,
) => {
  if (!dsl) {
    return undefined;
  }

  return {
    ...dsl,
    datasetName: dataset?.name,
    dimensionsReadable: dsl.dimensions?.map((dimension) =>
      serializeDimensionDsl(dimension, dataset),
    ),
    metricsReadable: dsl.metrics?.map((metric) =>
      serializeMetricDsl(metric, dataset),
    ),
    filtersReadable: dsl.filters?.map((filter) =>
      serializeFilterDsl(filter, dataset),
    ),
    tempMetricsReadable: dsl.tempMetrics?.map((tempMetric) =>
      serializeTempMetricDsl(tempMetric, dataset),
    ),
    orderByReadable: dsl.orderBy?.map((orderBy) =>
      serializeOrderByDsl(orderBy, dataset),
    ),
  };
};

export const buildPanelVisualizationSnapshotForAi = (params: {
  displayType: DisplayPanelType;
  editorConfig: PanelEditorConfig;
  dimensionItems: DimensionItem[];
  dropMetrics: DragItem[];
  dropFilters: Array<{
    id: string | number;
    fieldId: number;
    name: string;
    fieldType?: string;
    op: string;
    value?: unknown;
  }>;
  tempMetrics: TempMetricConfig[];
}) => {
  const {
    displayType,
    editorConfig,
    dimensionItems,
    dropMetrics,
    dropFilters,
    tempMetrics,
  } = params;

  return {
    visualization: summarizeEditorConfig(displayType, editorConfig),
    selectedDimensions: summarizeDimensionItems(dimensionItems),
    selectedMetrics: summarizeDragItems(dropMetrics),
    selectedFilters: dropFilters.map((filter) => ({
      id: filter.id,
      fieldId: filter.fieldId,
      displayName: filter.name,
      op: filter.op,
      value: filter.value,
    })),
    tempMetrics: tempMetrics.map((metric) => ({
      id: metric.id,
      alias: metric.alias,
      businessName: metric.businessName,
      displayName: metric.businessName || metric.alias || metric.id,
      type: metric.type,
      baseMetricId: metric.baseMetricId,
      timeFieldId: metric.timeFieldId,
      periodType: metric.periodType,
      calculationMode: metric.calculationMode,
    })),
  };
};

export const buildPanelSceneSummaryForAi = (params: {
  datasetName?: string;
  displayType: DisplayPanelType;
  editorConfig: PanelEditorConfig;
  dimensionItems: DimensionItem[];
  dropMetrics: DragItem[];
  dropFilters: Array<{
    id: string | number;
    fieldId: number;
    name: string;
    op: string;
    value?: unknown;
  }>;
  tempMetrics: TempMetricConfig[];
}) => {
  const {
    datasetName,
    displayType,
    editorConfig,
    dimensionItems,
    dropMetrics,
    dropFilters,
    tempMetrics,
  } = params;

  return {
    datasetName,
    displayType,
    chartType: editorConfig.type,
    selectedDimensionNames: dimensionItems.map(
      (item) => item.businessName || item.name,
    ),
    selectedMetricNames: dropMetrics.map(
      (item) => item.businessName || item.alias || item.name,
    ),
    selectedFilterNames: dropFilters.map((filter) => filter.name),
    tempMetricNames: tempMetrics.map(
      (metric) => metric.businessName || metric.alias || metric.id,
    ),
    fieldBindingsSummary: {
      xField: editorConfig.xField,
      yField: editorConfig.yField,
      seriesField: editorConfig.seriesField,
      categoryField: editorConfig.categoryField,
      valueField: editorConfig.valueField,
      sizeField: editorConfig.sizeField,
    },
    readableText: [
      datasetName ? `当前数据集：${datasetName}` : "",
      `当前展示类型：${displayType}`,
      editorConfig.type ? `图表类型：${editorConfig.type}` : "",
      dimensionItems.length
        ? `已选维度：${dimensionItems
            .map((item) => item.businessName || item.name)
            .join("、")}`
        : "已选维度：无",
      dropMetrics.length
        ? `已选指标：${dropMetrics
            .map((item) => item.businessName || item.alias || item.name)
            .join("、")}`
        : "已选指标：无",
      dropFilters.length
        ? `已选过滤：${dropFilters.map((filter) => filter.name).join("、")}`
        : "已选过滤：无",
    ]
      .filter(Boolean)
      .join("；"),
  };
};
