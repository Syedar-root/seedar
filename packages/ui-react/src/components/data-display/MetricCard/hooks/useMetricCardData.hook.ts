import { useMemo } from "react";

import { useQueryExecution } from "../../../../hooks";
import type {
  MetricCardProps,
  MetricCardResolvedProps,
} from "../types";
import { buildMetricCardData } from "../utils/buildMetricCardData";

export const useMetricCardData = (
  props: MetricCardProps,
): MetricCardResolvedProps | undefined => {
  const {
    chartColor,
    chartData,
    chartHighlightKeys,
    chartSmooth,
    className,
    config,
    data,
    formatting,
    icon,
    loading,
    onClick,
    prefix,
    progressColor,
    queryId,
    remainingLabel,
    suffix,
    target,
    targetLabel,
    title,
    trendDirection,
    value,
    variant,
    width,
    changeRate,
    changeValue,
  } = props;
  const { data: executedData } = useQueryExecution(queryId, !data);
  const rawData = data || executedData;

  return useMemo(
    () =>
      buildMetricCardData({
        chartColor,
        chartData,
        chartHighlightKeys,
        chartSmooth,
        className,
        config,
        data: rawData,
        formatting,
        icon,
        loading,
        onClick,
        prefix,
        progressColor,
        queryId,
        remainingLabel,
        suffix,
        target,
        targetLabel,
        title,
        trendDirection,
        value,
        variant,
        width,
        changeRate,
        changeValue,
      }),
    [
      changeRate,
      changeValue,
      chartColor,
      chartData,
      chartHighlightKeys,
      chartSmooth,
      className,
      config,
      formatting,
      icon,
      loading,
      onClick,
      prefix,
      progressColor,
      queryId,
      rawData,
      remainingLabel,
      suffix,
      target,
      targetLabel,
      title,
      trendDirection,
      value,
      variant,
      width,
    ],
  );
};
