import type { MetricCardCommonProps, ProgressCardProps } from "../types";

const UNIT_MULTIPLIER_MAP = {
  K: 1_000,
  M: 1_000_000,
  B: 1_000_000_000,
} as const;

function parseMetricNumber(value: MetricCardCommonProps["value"]) {
  if (value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalizedValue = value.trim().replaceAll(",", "");
  const matchResult = normalizedValue.match(/^(-?\d+(?:\.\d+)?)\s*([kKmMbB])?$/);

  if (!matchResult) {
    return 0;
  }

  const numericValue = Number(matchResult[1]);
  const unitKey = matchResult[2]?.toUpperCase() as keyof typeof UNIT_MULTIPLIER_MAP | undefined;

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  if (!unitKey) {
    return numericValue;
  }

  return numericValue * UNIT_MULTIPLIER_MAP[unitKey];
}

function formatRemainingValue(
  remainingValue: number,
  suffix?: MetricCardCommonProps["suffix"],
) {
  const normalizedSuffix = suffix?.trim().toLowerCase() ?? "";

  if (normalizedSuffix.includes("k")) {
    return `${(remainingValue / UNIT_MULTIPLIER_MAP.K).toFixed(1)}K`;
  }

  if (normalizedSuffix.includes("m")) {
    return `${(remainingValue / UNIT_MULTIPLIER_MAP.M).toFixed(1)}M`;
  }

  if (normalizedSuffix.includes("b")) {
    return `${(remainingValue / UNIT_MULTIPLIER_MAP.B).toFixed(1)}B`;
  }

  return remainingValue.toString();
}

export function getProgressCardMetrics(params: Pick<ProgressCardProps, "value" | "target" | "suffix">) {
  const { value, target, suffix } = params;
  const normalizedTarget =
    typeof target === "number" && Number.isFinite(target) ? target : 0;
  const isTargetValid = normalizedTarget > 0;
  const numericValue = parseMetricNumber(value);
  const progressPercent = isTargetValid
    ? Math.min(Math.max((numericValue / normalizedTarget) * 100, 0), 100)
    : 0;
  const remainingValue = isTargetValid
    ? Math.max(normalizedTarget - numericValue, 0)
    : 0;

  return {
    progressPercent,
    remainingValue,
    formattedRemainingValue: formatRemainingValue(remainingValue, suffix),
  };
}
