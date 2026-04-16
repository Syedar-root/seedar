import type {
  ExecuteQueryResponse,
  PanelFormattingConfig,
  QueryColumnMapping,
} from "#pkg/seedar/types";

import { applyFormattingToQueryData } from "../../../../utils/formatting/applyQueryFormatting";
import type { MetricCardViewData } from "../types";

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

export const buildMetricCardData = ({
  formatting,
  rawData,
}: {
  formatting?: PanelFormattingConfig;
  rawData?: ExecuteQueryResponse;
}): MetricCardViewData | undefined => {
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
  const primaryMapping = metricMappings[0] || mappings[0];
  const secondaryMapping = metricMappings[1];

  if (!primaryMapping) {
    return undefined;
  }

  const primaryIndex = primaryMapping.index ?? mappings.indexOf(primaryMapping);
  const secondaryIndex = secondaryMapping
    ? secondaryMapping.index ?? mappings.indexOf(secondaryMapping)
    : -1;

  const primaryValue = firstRow[primaryIndex] ?? "--";
  const secondaryValue = secondaryIndex >= 0 ? firstRow[secondaryIndex] : undefined;

  return {
    title: primaryMapping.businessName || primaryMapping.displayName,
    value: primaryValue,
    subTitle: secondaryMapping
      ? secondaryMapping.businessName || secondaryMapping.displayName
      : undefined,
    subValue: secondaryValue,
  };
};
