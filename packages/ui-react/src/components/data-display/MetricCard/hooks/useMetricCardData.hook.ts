import { useEffect, useMemo, useState } from "react";
import type { ExecuteQueryResponse } from "#pkg/seedar/types";

import { useExecuteQuery } from "../../../../hooks";
import type { MetricCardProps } from "../types";
import { buildMetricCardData } from "../utils/buildMetricCardData";

export const useMetricCardData = ({
  data,
  formatting,
  queryId,
}: MetricCardProps) => {
  const { mutate: executeQuery } = useExecuteQuery();
  const [rawData, setRawData] = useState<ExecuteQueryResponse | undefined>(data);

  useEffect(() => {
    if (data) {
      setRawData(data);
      return;
    }

    if (!queryId) {
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
        formatting,
        rawData,
      }),
    [formatting, rawData],
  );
};
