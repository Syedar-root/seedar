import type {
  ExecuteQueryResponse,
  PanelFormattingConfig,
  QueryColumnMapping,
} from "#pkg/seedar/types";

import { applyFormattingToQueryData } from "../../../../utils/formatting/applyQueryFormatting";
import type {
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
  if (Array.isArray(result?.columnMappings) && result.columnMappings.length > 0) {
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

const buildDerivedData = ({
  formatting,
  rawData,
}: {
  formatting?: PanelFormattingConfig;
  rawData?: ExecuteQueryResponse;
}): MetricCardDerivedData | undefined => {
  if (!rawData) {
    return undefined;
  }

  const formattedData = applyFormattingToQueryData(rawData, formatting, {
    surface: "card_value",
  });

  const rows = formattedData.results?.rows || [];
  const firstRow = rows[0] || [];
  const mappings = normalizeMappings(formattedData);
  const metricMappings = mappings.filter((mapping) => mapping.type === "metric");
  const dimensionMappings = mappings.filter(
    (mapping) => mapping.type === "dimension",
  );
  const primaryMapping = metricMappings[0] || mappings[0];
  const secondaryMapping = metricMappings[1];
  const xMapping = dimensionMappings[0];

  if (!primaryMapping) {
    return undefined;
  }

  const primaryIndex = getMappingIndex(primaryMapping, mappings);
  const secondaryIndex = getMappingIndex(secondaryMapping, mappings);
  const xIndex = getMappingIndex(xMapping, mappings);

  const chartData: ChartDataPoint[] = rows
    .map((row, index) => {
      const xValue =
        xIndex >= 0 ? (row[xIndex] as string | number | undefined) : index + 1;
      const yValue = parseNumericValue(row[primaryIndex]);

      if ((typeof xValue !== "string" && typeof xValue !== "number") || yValue === undefined) {
        return undefined;
      }

      return {
        x: xValue,
        y: yValue,
      };
    })
    .filter((item): item is ChartDataPoint => Boolean(item));

  const lastChartPoint = chartData[chartData.length - 1];

  return {
    title: primaryMapping.businessName || primaryMapping.displayName,
    value: toDisplayValue(firstRow[primaryIndex]),
    secondaryTitle: secondaryMapping
      ? secondaryMapping.businessName || secondaryMapping.displayName
      : undefined,
    secondaryValue:
      secondaryIndex >= 0 ? toDisplayValue(firstRow[secondaryIndex]) : undefined,
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
  config?: MetricCardPanelConfig,
): TrendDirection => props.trendDirection ?? config?.trendDirection ?? "none";

const resolveProgressTarget = (
  props: MetricCardProps,
  config: MetricCardPanelConfig | undefined,
  derivedData: MetricCardDerivedData | undefined,
) => {
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

const resolveBaseProps = (
  props: MetricCardProps,
  config: MetricCardPanelConfig | undefined,
  derivedData: MetricCardDerivedData | undefined,
) => {
  return {
    title: props.title ?? config?.title ?? derivedData?.title ?? "--",
    value: props.value ?? derivedData?.value ?? "--",
    icon: props.icon,
    suffix: props.suffix ?? config?.suffix,
    prefix: props.prefix ?? config?.prefix,
    loading: props.loading,
    onClick: props.onClick,
    className: props.className,
    trendDirection: resolveTrendDirection(props, config),
    changeRate: props.changeRate ?? config?.changeRate,
    changeValue:
      props.changeValue ??
      config?.changeValue ??
      (typeof derivedData?.secondaryValue === "string" ||
      typeof derivedData?.secondaryValue === "number"
        ? String(derivedData.secondaryValue)
        : undefined),
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
  });
  const baseProps = resolveBaseProps(props, config, derivedData);

  if (!baseProps.title || baseProps.value === undefined) {
    return undefined;
  }

  if (variant === "withProgress") {
    const resolvedTarget = resolveProgressTarget(props, config, derivedData);

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
