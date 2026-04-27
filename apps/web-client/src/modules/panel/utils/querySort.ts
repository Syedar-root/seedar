import type { QueryOrderByDSL } from "#pkg/seedar/types";
import type {
  DimensionItem,
  DragItem,
  SortCandidate,
  SortItem,
  TempMetricConfig,
} from "../types";

const buildSortCandidateIdentity = (
  sourceType: SortCandidate["sourceType"],
  sourceId: string,
) => `${sourceType}:${sourceId}`;

const buildFallbackLabel = (orderBy: QueryOrderByDSL): string => {
  if (orderBy.alias) {
    return orderBy.alias;
  }
  if (orderBy.field) {
    return orderBy.field;
  }
  if (orderBy.tempMetricId) {
    return `Temp Metric ${orderBy.tempMetricId}`;
  }
  if (orderBy.metricId !== undefined) {
    return `Metric ${orderBy.metricId}`;
  }
  if (orderBy.fieldId !== undefined) {
    return `Field ${orderBy.fieldId}`;
  }
  return "Sort Item";
};

export const buildSortCandidateFromDimension = (
  dimension: DimensionItem,
): SortCandidate | undefined => {
  if (dimension.isDerived) {
    const alias =
      typeof dimension.dimensionDsl.alias === "string"
        ? dimension.dimensionDsl.alias.trim()
        : "";
    if (!alias) {
      return undefined;
    }

    const sourceId = String(dimension.id);
    return {
      id: buildSortCandidateIdentity("dimension", sourceId),
      sourceType: "dimension",
      sourceId,
      label: dimension.businessName || dimension.name || alias,
      orderBy: { alias },
      defaultDir: "asc",
    };
  }

  const fieldId = (dimension.dimensionDsl as { fieldId?: number }).fieldId;
  if (typeof fieldId !== "number") {
    return undefined;
  }

  const sourceId = String(dimension.id);
  return {
    id: buildSortCandidateIdentity("dimension", sourceId),
    sourceType: "dimension",
    sourceId,
    label: dimension.businessName || dimension.name || `Field ${fieldId}`,
    orderBy: { fieldId },
    defaultDir: "asc",
  };
};

export const buildSortCandidateFromMetric = (
  metric: DragItem,
): SortCandidate | undefined => {
  const metricId = Number(metric.id);
  if (Number.isNaN(metricId)) {
    return undefined;
  }

  const sourceId = String(metric.id);
  return {
    id: buildSortCandidateIdentity("metric", sourceId),
    sourceType: "metric",
    sourceId,
    label: metric.businessName || metric.name || `Metric ${metricId}`,
    orderBy: { metricId },
    defaultDir: "desc",
  };
};

export const buildSortCandidateFromTempMetric = (
  tempMetric: TempMetricConfig,
): SortCandidate | undefined => {
  if (!tempMetric.id) {
    return undefined;
  }

  const sourceId = String(tempMetric.id);
  return {
    id: buildSortCandidateIdentity("temp_metric", sourceId),
    sourceType: "temp_metric",
    sourceId,
    label: tempMetric.businessName || tempMetric.alias || tempMetric.id,
    orderBy: { tempMetricId: tempMetric.id },
    defaultDir: "desc",
  };
};

export const buildSortCandidates = ({
  dimensions,
  metrics,
  tempMetrics,
}: {
  dimensions: DimensionItem[];
  metrics: DragItem[];
  tempMetrics: TempMetricConfig[];
}): SortCandidate[] => {
  const nextCandidates: SortCandidate[] = [];

  dimensions.forEach((dimension) => {
    const candidate = buildSortCandidateFromDimension(dimension);
    if (candidate) {
      nextCandidates.push(candidate);
    }
  });

  metrics.forEach((metric) => {
    const candidate = buildSortCandidateFromMetric(metric);
    if (candidate) {
      nextCandidates.push(candidate);
    }
  });

  tempMetrics.forEach((tempMetric) => {
    const candidate = buildSortCandidateFromTempMetric(tempMetric);
    if (candidate) {
      nextCandidates.push(candidate);
    }
  });

  return nextCandidates;
};

export const createSortItemFromCandidate = (
  candidate: SortCandidate,
): SortItem => ({
  id: candidate.id,
  sourceType: candidate.sourceType,
  sourceId: candidate.sourceId,
  label: candidate.label,
  orderBy: candidate.orderBy,
  dir: candidate.defaultDir,
});

const inferSortSourceType = (
  orderBy: QueryOrderByDSL,
): SortItem["sourceType"] => {
  if (orderBy.tempMetricId) {
    return "temp_metric";
  }
  if (orderBy.metricId !== undefined) {
    return "metric";
  }
  return "dimension";
};

export const hydrateSortItems = (
  orderByList: QueryOrderByDSL[] | undefined,
  candidates: SortCandidate[],
): SortItem[] => {
  if (!Array.isArray(orderByList) || orderByList.length === 0) {
    return [];
  }

  return orderByList.map((orderBy, index) => {
    const matchedCandidate = candidates.find((candidate) => {
      if (candidate.orderBy.tempMetricId && orderBy.tempMetricId) {
        return candidate.orderBy.tempMetricId === orderBy.tempMetricId;
      }
      if (
        candidate.orderBy.metricId !== undefined &&
        orderBy.metricId !== undefined
      ) {
        return candidate.orderBy.metricId === orderBy.metricId;
      }
      if (candidate.orderBy.alias && orderBy.alias) {
        return candidate.orderBy.alias === orderBy.alias;
      }
      if (
        candidate.orderBy.fieldId !== undefined &&
        orderBy.fieldId !== undefined
      ) {
        return candidate.orderBy.fieldId === orderBy.fieldId;
      }
      return false;
    });

    const sourceType =
      matchedCandidate?.sourceType ?? inferSortSourceType(orderBy);
    const sourceId =
      matchedCandidate?.sourceId ??
      String(
        orderBy.tempMetricId ??
          orderBy.metricId ??
          orderBy.alias ??
          orderBy.fieldId ??
          orderBy.field ??
          index,
      );

    return {
      id: `${buildSortCandidateIdentity(sourceType, sourceId)}:${index}`,
      sourceType,
      sourceId,
      label: matchedCandidate?.label ?? buildFallbackLabel(orderBy),
      orderBy: {
        fieldId: orderBy.fieldId,
        metricId: orderBy.metricId,
        tempMetricId: orderBy.tempMetricId,
        alias: orderBy.alias,
        field: orderBy.field,
      },
      dir: orderBy.dir ?? orderBy.direction ?? "asc",
    };
  });
};

export const syncSortItemsWithCandidates = (
  sortItems: SortItem[],
  candidates: SortCandidate[],
): SortItem[] => {
  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );

  return sortItems.flatMap((item) => {
    const candidate = candidateMap.get(
      buildSortCandidateIdentity(item.sourceType, item.sourceId),
    );
    if (!candidate) {
      return [];
    }

    return [
      {
        ...item,
        label: candidate.label,
        orderBy: candidate.orderBy,
      },
    ];
  });
};
