import type {
  ExecuteQueryResponse,
  PanelFormattingConfig,
} from "#pkg/seedar/types";
import type { ISpec } from "@visactor/react-vchart";
import { useEffect, useMemo, useState } from "react";

import { useExecuteQuery } from "../../../../hooks";
import { applyFormattingToQueryData } from "../../../../utils/formatting/applyQueryFormatting";
import { applyChartFormattingToSpec } from "../utils/chartFormatting";
import { transformData } from "../utils/transformChartSpec";
import type { ChartProps } from "../types";

const CHART_EDITOR_MODE_KEY = "__seedarEditorMode";
const CHART_EDITOR_ADVANCED_SPEC_KEY = "__seedarAdvancedSpec";

const getRuntimeSpec = (spec: ISpec): {
  formatting?: PanelFormattingConfig;
  runtimeSpec: ISpec;
} => {
  const runtimeSpec = {
    ...(spec as unknown as Record<string, unknown>),
  } as Record<string, unknown>;
  const formatting = runtimeSpec.formatting as PanelFormattingConfig | undefined;

  delete runtimeSpec.formatting;
  delete runtimeSpec[CHART_EDITOR_MODE_KEY];
  delete runtimeSpec[CHART_EDITOR_ADVANCED_SPEC_KEY];

  return {
    formatting,
    runtimeSpec: runtimeSpec as unknown as ISpec,
  };
};

export const useChartData = ({
  data,
  queryId,
  spec,
}: Pick<ChartProps, "data" | "queryId" | "spec">): ISpec | undefined => {
  const { mutate: executeQuery } = useExecuteQuery();
  const [rawData, setRawData] = useState<ExecuteQueryResponse>();

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

  return useMemo(() => {
    if (!rawData || !spec) {
      return undefined;
    }

    const { formatting, runtimeSpec } = getRuntimeSpec(spec);
    const formattedData = applyFormattingToQueryData(rawData, formatting, {
      preserveMetricNumber: true,
      surface: "table_cell",
    });

    const transformed = transformData(formattedData, runtimeSpec);
    if (!transformed) {
      return undefined;
    }

    const nextSpec = applyChartFormattingToSpec({
      spec: transformed,
      data: rawData,
      formatting,
    });

    return {
      ...nextSpec,
      autoFit: true,
    };
  }, [rawData, spec]);
};
