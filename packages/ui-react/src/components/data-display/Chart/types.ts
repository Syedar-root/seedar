import type React from "react";
import type { ExecuteQueryResponse } from "#pkg/seedar/types";
import type { ISpec, VChart } from "@visactor/react-vchart";

export interface ChartProps {
  vchartProps?: React.ComponentProps<typeof VChart>;
  spec: ISpec;
  queryId?: string;
  data?: ExecuteQueryResponse;
  onRenderStatusChange?: (status: {
    ok: boolean;
    error?: Error;
  }) => void;
}
