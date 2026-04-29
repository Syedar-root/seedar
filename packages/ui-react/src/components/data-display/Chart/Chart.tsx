import { type ISpec, VChart } from "@visactor/react-vchart";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useEffect, useMemo } from "react";

import { useChartData } from "./hooks/useChartData.hook";
import type { ChartProps } from "./types";

const ChartErrorFallback: React.FC<FallbackProps> = ({ error }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      minHeight: 120,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      borderRadius: 6,
      border: "1px solid rgba(128,128,128,0.25)",
      color: "var(--text-secondary)",
      background: "var(--bg-elevated)",
      fontSize: 12,
      textAlign: "center",
    }}
  >
    Chart render failed. Please check whether the Spec matches the chart type.
    {error?.message ? ` (${error.message})` : ""}
  </div>
);

const ChartContent: React.FC<{
  resolvedSpec: ISpec;
  vchartProps: React.ComponentProps<typeof VChart>;
  boundaryResetKey: string;
  onRenderStatusChange?: (status: {
    ok: boolean;
    error?: Error;
  }) => void;
}> = ({ resolvedSpec, vchartProps, boundaryResetKey, onRenderStatusChange }) => {
  useEffect(() => {
    onRenderStatusChange?.({
      ok: true,
    });
  }, [boundaryResetKey, onRenderStatusChange]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <VChart spec={{ ...resolvedSpec }} {...vchartProps} />
    </div>
  );
};

export const Chart: React.FC<ChartProps> = ({
  vchartProps = {},
  spec,
  queryId,
  data,
  onRenderStatusChange,
}) => {
  const resolvedSpec = useChartData({
    data,
    queryId,
    spec: (spec ?? { type: "bar" }) as ISpec,
  });
  const boundaryResetKey = useMemo(() => JSON.stringify(spec), [spec]);

  if (!resolvedSpec?.data) {
    return null;
  }

  return (
    <ErrorBoundary
      FallbackComponent={ChartErrorFallback}
      onError={(error) => {
        console.error("[Chart] render failed:", error);
        onRenderStatusChange?.({
          ok: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }}
      resetKeys={[boundaryResetKey]}
    >
      <ChartContent
        resolvedSpec={resolvedSpec}
        vchartProps={vchartProps}
        boundaryResetKey={boundaryResetKey}
        onRenderStatusChange={onRenderStatusChange}
      />
    </ErrorBoundary>
  );
};
