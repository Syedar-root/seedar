import { useMemo } from "react";

import { Chart } from "../../../data-display/Chart";
import { ListTable } from "../../../data-display/ListTable";
import { MetricCard } from "../../../data-display/MetricCard";
import { resolvePanelContent } from "../utils/resolvePanelContent";
import type { SeedarPanelProps } from "../types";

export const useSeedarPanelContent = ({
  data,
  finalPanel,
  onChartRenderStatusChange,
}: Pick<SeedarPanelProps, "data" | "onChartRenderStatusChange"> & {
  finalPanel?: SeedarPanelProps["panel"];
}) =>
  useMemo(() => {
    const descriptor = resolvePanelContent(finalPanel);

    if (descriptor.kind === "chart") {
      return (
        <Chart
          spec={descriptor.spec}
          queryId={descriptor.queryId}
          data={data}
          onRenderStatusChange={onChartRenderStatusChange}
        />
      );
    }

    if (descriptor.kind === "table") {
      return (
        <ListTable
          queryId={descriptor.queryId}
          data={data}
          formatting={descriptor.formatting}
        />
      );
    }

    if (descriptor.kind === "card") {
      return (
        <MetricCard
          queryId={descriptor.queryId}
          data={data}
          formatting={descriptor.formatting}
          config={descriptor.config}
        />
      );
    }

    if (descriptor.kind === "text") {
      return <div>{descriptor.content}</div>;
    }

    return null;
  }, [data, finalPanel, onChartRenderStatusChange]);
