import type {
  ExecuteQueryResponse,
  PanelFormattingConfig,
} from "#pkg/seedar/types";
import { ISpec, VChart } from "@visactor/react-vchart";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useEffect, useMemo, useState } from "react";
import { useExecuteQuery } from "../../hooks";
import { applyFormattingToQueryData } from "../formatting/formatting";
import { transformData } from "./transformer";

const CHART_EDITOR_MODE_KEY = "__seedarEditorMode";
const CHART_EDITOR_ADVANCED_SPEC_KEY = "__seedarAdvancedSpec";

export interface ChartProps {
  vchartProps?: React.ComponentProps<typeof VChart>;
  spec: ISpec;
  queryId?: string;
  data?: ExecuteQueryResponse;
}

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

export const Chart: React.FC<ChartProps> = ({
  vchartProps = {},
  spec: propSpec,
  queryId,
  data,
}) => {
  const spec = propSpec ?? { type: "bar" };
  const { mutate: executeQuery } = useExecuteQuery();
  const [rawData, setRawData] = useState<ExecuteQueryResponse>();
  const [specOption, setSpecOption] = useState<ISpec>({
    ...spec,
    autoFit: true,
  });

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

  useEffect(() => {
    if (!rawData || !spec) {
      return;
    }

    const runtimeSpec = {
      ...(spec as unknown as Record<string, unknown>),
    } as Record<string, unknown>;
    const formatting = runtimeSpec.formatting as
      | PanelFormattingConfig
      | undefined;
    delete runtimeSpec.formatting;
    delete runtimeSpec[CHART_EDITOR_MODE_KEY];
    delete runtimeSpec[CHART_EDITOR_ADVANCED_SPEC_KEY];

    const formattedData = applyFormattingToQueryData(rawData, formatting, {
      preserveMetricNumber: true,
      surface: "table_cell",
    });

    const transformed = transformData(
      formattedData,
      runtimeSpec as unknown as ISpec,
    );

    if (!transformed) {
      return;
    }

    setSpecOption(transformed);
  }, [rawData, spec]);

  const resolvedSpec = useMemo(
    () => ({ ...specOption, autoFit: true }),
    [specOption],
  );
  const boundaryResetKey = useMemo(() => JSON.stringify(spec), [spec]);

  if (!resolvedSpec.data) {
    return null;
  }

  return (
    <ErrorBoundary
      FallbackComponent={ChartErrorFallback}
      onError={(error) => {
        console.error("[Chart] render failed:", error);
      }}
      resetKeys={[boundaryResetKey]}
    >
      <VChart spec={resolvedSpec} {...vchartProps} />
    </ErrorBoundary>
  );
};
