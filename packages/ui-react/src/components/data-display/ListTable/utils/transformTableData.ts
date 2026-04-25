import type {
  ExecuteQueryResponse,
  PanelFormattingConfig,
} from "#pkg/seedar/types";

import { applyFormattingToQueryData } from "../../../../utils/formatting/applyQueryFormatting";
import type { TableTransformResult } from "../types";

export const transformTableData = (
  data: ExecuteQueryResponse,
  formatting?: PanelFormattingConfig,
): TableTransformResult => {
  const effectiveData = applyFormattingToQueryData(data, formatting, {
    surface: "table_cell",
  });

  const headers = effectiveData.results?.header || [];
  const rows = effectiveData.results?.rows || [];

  const columns = headers.map((header, index) => {
    const field = `col_${index}`;

    return {
      title: header,
      field,
      width: "auto" as const,
      headerStyle: { textAlign: "left" as const },
      fieldFormat: (record: Record<string, unknown>) =>
        (record[field] as string | number) ?? "",
    };
  });

  const records = rows.map((row) => {
    const next: Record<string, unknown> = {};
    columns.forEach((column, index) => {
      next[column.field] = row[index] ?? null;
    });
    return next;
  });

  return {
    columns,
    records,
  };
};
