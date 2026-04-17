import { useEffect, useMemo, useState } from "react";
import type { ExecuteQueryResponse } from "#pkg/seedar/types";

import { useExecuteQuery } from "../../../../hooks";
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
  const { mutate: executeQuery } = useExecuteQuery();
  const [rawData, setRawData] = useState<ExecuteQueryResponse | undefined>(data);

  useEffect(() => {
    if (data) {
      setRawData(data);
      return;
    }

    if (!queryId) {
      setRawData(undefined);
      return;
    }

    executeQuery(queryId, {
      onSuccess: (queryData) => {
        setRawData(queryData);
      },
    });
  }, [data, executeQuery, queryId]);

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
