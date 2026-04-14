import type {
  ExecuteQueryResponse,
  PanelFormattingConfig,
} from "#pkg/seedar/types";
import { ISpec, VChart } from "@visactor/react-vchart";
import { useEffect, useMemo, useState } from "react";
import { useExecuteQuery } from "../../hooks";
import { applyFormattingToQueryData } from "../formatting/formatting";
import { transformData } from "./transformer";

export interface ChartProps {
  vchartProps?: React.ComponentProps<typeof VChart>;
  spec: ISpec;
  queryId?: string;
  data?: ExecuteQueryResponse;
}

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

  if (!resolvedSpec.data) {
    return null;
  }

  return <VChart spec={resolvedSpec} {...vchartProps} />;
};
