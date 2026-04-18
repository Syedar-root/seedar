import type {
  ExecuteQueryResponse,
  PanelFormattingConfig,
  QueryColumnMapping,
} from "#pkg/seedar/types";

import { applyFormattingToQueryData } from "../../../../utils/formatting/applyQueryFormatting";
import type {
  CardValuePickMode,
  ChartDataPoint,
  MetricCardDerivedData,
  MetricCardPanelConfig,
  MetricCardProps,
  MetricCardResolvedProps,
  MetricCardVariant,
  ProgressCardProps,
  TrendDirection,
} from "../types";

const DEFAULT_PROGRESS_TARGET = 100;

const normalizeMappings = (
  result?: ExecuteQueryResponse,
): QueryColumnMapping[] => {
  if (
    Array.isArray(result?.columnMappings) &&
    result.columnMappings.length > 0
  ) {
    return result.columnMappings;
  }

  const headers = result?.results?.header || [];
  return headers.map((header, index) => ({
    alias: `col_${index}`,
    type: "dimension" as const,
    displayName: header,
    businessName: header,
    index,
    target: { kind: "unknown" as const },
  }));
};

const getMappingIndex = (
  mapping: QueryColumnMapping | undefined,
  mappings: QueryColumnMapping[],
): number => {
  if (!mapping) {
    return -1;
  }

  return mapping.index ?? mappings.indexOf(mapping);
};

const parseNumericValue = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().replaceAll(",", "");
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized.replace(/%$/, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toDisplayValue = (value: unknown): string | number | undefined => {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return value === undefined || value === null ? undefined : String(value);
};

const normalizeFieldKey = (value: string | undefined) =>
  value?.trim().toLowerCase() ?? "";

const getMappingCandidates = (mapping: QueryColumnMapping): string[] =>
  [mapping.businessName, mapping.displayName, mapping.alias]
    .filter((item): item is string => Boolean(item))
    .map((item) => item.trim().toLowerCase());

const findMappingByFieldKey = (
  mappings: QueryColumnMapping[],
  fieldKey?: string,
): QueryColumnMapping | undefined => {
  const normalizedFieldKey = normalizeFieldKey(fieldKey);
  if (!normalizedFieldKey) {
    return undefined;
  }

  return mappings.find((mapping) =>
    getMappingCandidates(mapping).includes(normalizedFieldKey),
  );
};

const getRowValueByMapping = (
  row: unknown[] | undefined,
  mapping: QueryColumnMapping | undefined,
  mappings: QueryColumnMapping[],
): unknown => {
  if (!row || !mapping) {
    return undefined;
  }

  const index = getMappingIndex(mapping, mappings);
  if (index < 0) {
    return undefined;
  }

  return row[index];
};

const getLastMappedValue = (
  rows: unknown[][],
  mapping: QueryColumnMapping | undefined,
  mappings: QueryColumnMapping[],
): unknown => {
  if (!mapping || rows.length === 0) {
    return undefined;
  }

  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const value = getRowValueByMapping(rows[index], mapping, mappings);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
};

const getFirstMappedValue = (
  rows: unknown[][],
  mapping: QueryColumnMapping | undefined,
  mappings: QueryColumnMapping[],
): unknown => {
  if (!mapping || rows.length === 0) {
    return undefined;
  }

  for (let index = 0; index < rows.length; index += 1) {
    const value = getRowValueByMapping(rows[index], mapping, mappings);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
};

const getMappedValueByMode = (params: {
  rows: unknown[][];
  mapping: QueryColumnMapping | undefined;
  mappings: QueryColumnMapping[];
  mode?: CardValuePickMode;
}): unknown => {
  const { rows, mapping, mappings, mode = "last" } = params;

  if (mode === "first") {
    return getFirstMappedValue(rows, mapping, mappings);
  }

  return getLastMappedValue(rows, mapping, mappings);
};

const buildChartData = (params: {
  rows: unknown[][];
  mappings: QueryColumnMapping[];
  xMapping?: QueryColumnMapping;
  yMapping?: QueryColumnMapping;
}): ChartDataPoint[] => {
  const { rows, mappings, xMapping, yMapping } = params;

  return rows
    .map((row, index) => {
      const rawXValue = getRowValueByMapping(row, xMapping, mappings);
      const xValue =
        typeof rawXValue === "string" || typeof rawXValue === "number"
          ? rawXValue
          : index + 1;
      const yValue = parseNumericValue(
        getRowValueByMapping(row, yMapping, mappings),
      );

      if (yValue === undefined) {
        return undefined;
      }

      return {
        x: xValue,
        y: yValue,
      };
    })
    .filter((item): item is ChartDataPoint => Boolean(item));
};

const buildDerivedData = ({
  formatting,
  rawData,
  config,
}: {
  formatting?: PanelFormattingConfig;
  rawData?: ExecuteQueryResponse;
  config?: MetricCardPanelConfig;
}): MetricCardDerivedData | undefined => {
  if (!rawData) {
    return undefined;
  }

  const formattedData = applyFormattingToQueryData(rawData, formatting, {
    surface: "card_value",
  });

  const rows = formattedData.results?.rows || [];
  const mappings = normalizeMappings(formattedData);
  const metricMappings = mappings.filter(
    (mapping) => mapping.type === "metric",
  );
  const dimensionMappings = mappings.filter(
    (mapping) => mapping.type === "dimension",
  );
  const fallbackValueMapping =
    metricMappings[metricMappings.length - 1] || mappings[mappings.length - 1];
  const fallbackSecondaryMapping = metricMappings[1];
  const valueMapping =
    findMappingByFieldKey(mappings, config?.valueField) ?? fallbackValueMapping;
  const secondaryMapping =
    findMappingByFieldKey(mappings, config?.changeValueField) ??
    fallbackSecondaryMapping;
  const chartXMapping =
    findMappingByFieldKey(mappings, config?.chartXField) ??
    dimensionMappings[0];
  const chartYMapping =
    findMappingByFieldKey(mappings, config?.chartYField) ?? valueMapping;

  if (!valueMapping) {
    return undefined;
  }

  const chartData = buildChartData({
    rows,
    mappings,
    xMapping: chartXMapping,
    yMapping: chartYMapping,
  });
  const lastChartPoint = chartData[chartData.length - 1];

  return {
    rows,
    title: valueMapping.businessName || valueMapping.displayName,
    value: toDisplayValue(
      getMappedValueByMode({
        rows,
        mapping: valueMapping,
        mappings,
        mode: config?.valuePickMode,
      }),
    ),
    secondaryTitle: secondaryMapping
      ? secondaryMapping.businessName || secondaryMapping.displayName
      : undefined,
    secondaryValue: getMappedValueByMode({
      rows,
      mapping: secondaryMapping,
      mappings,
      mode: config?.valuePickMode,
    }),
    chartData,
    chartHighlightKeys: lastChartPoint ? [lastChartPoint.x] : [],
    mappings,
  };
};

const resolveVariant = (
  variant: MetricCardProps["variant"],
  config?: MetricCardPanelConfig,
): string => variant ?? config?.variant ?? "default";

const resolveTrendDirection = (
  props: MetricCardProps,
  config: MetricCardPanelConfig | undefined,
  derivedData: MetricCardDerivedData | undefined,
): TrendDirection => {
  if (props.trendDirection) {
    return props.trendDirection;
  }

  if (config?.trendDirection && config.trendDirection !== "none") {
    return config.trendDirection;
  }

  const numericChangeValue = parseNumericValue(derivedData?.secondaryValue);
  if (numericChangeValue === undefined || numericChangeValue === 0) {
    return config?.trendDirection ?? "none";
  }

  return numericChangeValue > 0 ? "up" : "down";
};

const resolveProgressTarget = (params: {
  props: MetricCardProps;
  config?: MetricCardPanelConfig;
  derivedData?: MetricCardDerivedData;
}): number => {
  const { props, config, derivedData } = params;
  if (typeof props.target === "number" && Number.isFinite(props.target)) {
    return props.target;
  }

  if (
    typeof config?.progressTarget === "number" &&
    Number.isFinite(config.progressTarget)
  ) {
    return config.progressTarget;
  }

  const derivedTarget = parseNumericValue(derivedData?.secondaryValue);
  if (derivedTarget !== undefined) {
    return derivedTarget;
  }

  return DEFAULT_PROGRESS_TARGET;
};

const resolveDisplayValue = (params: {
  props: MetricCardProps;
  config?: MetricCardPanelConfig;
  derivedData?: MetricCardDerivedData;
  variant: string;
}): string | number => {
  const { props, config, derivedData, variant } = params;
  if (props.value !== undefined) {
    return props.value;
  }

  if (variant !== "withLineChart") {
    return derivedData?.value ?? "--";
  }

  const explicitValueMapping = findMappingByFieldKey(
    derivedData?.mappings ?? [],
    config?.valueField,
  );
  const shouldUseChartTail =
    !explicitValueMapping ||
    normalizeFieldKey(config?.valueField) ===
      normalizeFieldKey(config?.chartYField);

  if (shouldUseChartTail) {
    const lastChartPoint =
      derivedData?.chartData[derivedData.chartData.length - 1];
    if (lastChartPoint) {
      return lastChartPoint.y;
    }
  }

  return derivedData?.value ?? "--";
};

const resolveBaseProps = (params: {
  props: MetricCardProps;
  config?: MetricCardPanelConfig;
  derivedData?: MetricCardDerivedData;
  variant: string;
}) => {
  const { props, config, derivedData, variant } = params;

  return {
    title: props.title ?? config?.title ?? derivedData?.title ?? "--",
    value: resolveDisplayValue({
      props,
      config,
      derivedData,
      variant,
    }),
    icon: props.icon,
    suffix: props.suffix ?? config?.suffix,
    prefix: props.prefix ?? config?.prefix,
    loading: props.loading,
    onClick: props.onClick,
    className: props.className,
    trendDirection: resolveTrendDirection(props, config, derivedData),
    changeRate: props.changeRate ?? config?.changeRate,
    changeValue:
      (typeof derivedData?.secondaryValue === "string" ||
      typeof derivedData?.secondaryValue === "number"
        ? String(derivedData.secondaryValue)
        : undefined) ??
      props.changeValue ??
      config?.changeValue,
    width: props.width ?? config?.width,
  };
};

export const buildMetricCardData = ({
  formatting,
  data,
  config,
  ...props
}: MetricCardProps): MetricCardResolvedProps | undefined => {
  const variant = resolveVariant(props.variant, config);
  const derivedData = buildDerivedData({
    formatting,
    rawData: data,
    config,
  });
  const baseProps = resolveBaseProps({
    props,
    config,
    derivedData,
    variant,
  });

  if (!baseProps.title || baseProps.value === undefined) {
    return undefined;
  }

  if (variant === "withProgress") {
    const resolvedTarget = resolveProgressTarget({
      props,
      config,
      derivedData,
    });

    return {
      ...baseProps,
      variant,
      target: resolvedTarget,
      targetLabel: props.targetLabel ?? config?.progressTargetLabel ?? "Target",
      remainingLabel:
        props.remainingLabel ?? config?.progressRemainingLabel ?? "Remaining",
      progressColor: props.progressColor ?? config?.progressColor,
    } satisfies ProgressCardProps;
  }

  if (variant === "withLineChart") {
    return {
      ...baseProps,
      variant,
      chartData: props.chartData ?? derivedData?.chartData ?? [],
      chartColor: props.chartColor ?? config?.chartColor,
      chartSmooth: props.chartSmooth ?? config?.chartSmooth,
      chartHighlightKeys:
        props.chartHighlightKeys ??
        config?.chartHighlightKeys ??
        derivedData?.chartHighlightKeys,
    };
  }

  return {
    ...baseProps,
    variant: variant as MetricCardVariant,
  };
};
