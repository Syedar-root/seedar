import type React from "react";
import type { ExecuteQueryResponse, PanelFormattingConfig } from "#pkg/seedar/types";
import type { ListTable as VListTable } from "@visactor/react-vtable";

export interface ListTableProps {
  vtableProps?: React.ComponentProps<typeof VListTable>;
  queryId?: string;
  data?: ExecuteQueryResponse;
  formatting?: PanelFormattingConfig;
}

export interface TableTransformResult {
  columns: Array<{
    title: string;
    field: string;
    width: "auto";
    headerStyle: { textAlign: "left" };
    fieldFormat: (record: Record<string, unknown>) => string | number;
  }>;
  records: Array<Record<string, unknown>>;
}
