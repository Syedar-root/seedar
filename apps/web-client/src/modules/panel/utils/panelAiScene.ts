import type { DatasetResponse, QueryDSL } from "#pkg/seedar/types";
import type {
  DisplayPanelType,
  PanelEditorConfig,
} from "../components/panelEditor/types";

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

const getAiReadableName = (item: unknown) => {
  if (!isRecord(item)) {
    return undefined;
  }

  if (typeof item.displayName === "string" && item.displayName) {
    return item.displayName;
  }

  if (typeof item.businessName === "string" && item.businessName) {
    return item.businessName;
  }

  if (typeof item.alias === "string" && item.alias) {
    return item.alias;
  }

  if (typeof item.name === "string" && item.name) {
    return item.name;
  }

  return undefined;
};

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

const summarizeEditorConfig = (
  displayType: DisplayPanelType,
  editorConfig: PanelEditorConfig,
) => ({
  displayType,
  chartType: editorConfig.type,
  advancedSpecMode: Boolean(editorConfig.isAdvancedSpecMode),
  advancedSpec: editorConfig.isAdvancedSpecMode
    ? editorConfig.advancedSpec
    : undefined,
  fieldBindings: {
    xField: editorConfig.xField,
    yField: editorConfig.yField,
    seriesField: editorConfig.seriesField,
    categoryField: editorConfig.categoryField,
    valueField: editorConfig.valueField,
    sizeField: editorConfig.sizeField,
  },
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
    datasetName: dataset?.name,
    datasetId: dsl.datasetId,
    tableId: dsl.tableId,
    dimensions: dsl.dimensions?.map((dimension) =>
      serializeDimensionDsl(dimension, dataset),
    ),
    metrics: dsl.metrics?.map((metric) => serializeMetricDsl(metric, dataset)),
    filters: dsl.filters?.map((filter) => serializeFilterDsl(filter, dataset)),
    tempMetrics: dsl.tempMetrics?.map((tempMetric) =>
      serializeTempMetricDsl(tempMetric, dataset),
    ),
    orderBy: dsl.orderBy?.map((orderBy) =>
      serializeOrderByDsl(orderBy, dataset),
    ),
    topN: dsl.topN,
    limit: dsl.limit,
    offset: dsl.offset,
  };
};

export const buildPanelVisualizationSnapshotForAi = (params: {
  displayType: DisplayPanelType;
  editorConfig: PanelEditorConfig;
}) => {
  const { displayType, editorConfig } = params;
  return summarizeEditorConfig(displayType, editorConfig);
};

export const buildPanelSceneSummaryForAi = (params: {
  datasetName?: string;
  dsl:
    | ReturnType<typeof serializePanelDslForAi>
    | undefined;
  visualizationSnapshot: ReturnType<typeof buildPanelVisualizationSnapshotForAi>;
}) => {
  const { datasetName, dsl, visualizationSnapshot } = params;
  const dimensionNames =
    dsl?.dimensions?.map((item) => getAiReadableName(item)).filter(Boolean) ?? [];
  const metricNames =
    dsl?.metrics?.map((item) => getAiReadableName(item)).filter(Boolean) ?? [];
  const filterNames =
    dsl?.filters?.map((item) => getAiReadableName(item)).filter(Boolean) ?? [];
  const tempMetricNames =
    dsl?.tempMetrics?.map((item) => getAiReadableName(item)).filter(Boolean) ?? [];

  return {
    readableText: [
      datasetName ? `当前数据集：${datasetName}` : "",
      `当前展示类型：${visualizationSnapshot.displayType}`,
      visualizationSnapshot.chartType
        ? `图表类型：${visualizationSnapshot.chartType}`
        : "",
      dimensionNames.length
        ? `DSL 维度：${dimensionNames.join("、")}`
        : "已选维度：无",
      metricNames.length
        ? `DSL 指标：${metricNames.join("、")}`
        : "已选指标：无",
      filterNames.length
        ? `DSL 过滤：${filterNames.join("、")}`
        : "已选过滤：无",
      tempMetricNames.length
        ? `DSL 临时指标：${tempMetricNames.join("、")}`
        : "",
      visualizationSnapshot.advancedSpecMode ? "当前已启用高级 Spec 模式" : "",
    ]
      .filter(Boolean)
      .join("；"),
  };
};
