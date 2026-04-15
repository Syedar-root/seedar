import { ListTable as VListTable } from "@visactor/react-vtable";
import { useEffect, useMemo, useState } from "react";
import type { PanelFormattingConfig } from "#pkg/seedar/types";
import type { ExecuteQueryResponse } from "#pkg/seedar/types";
import { useExecuteQuery } from "../../hooks";
import { applyFormattingToQueryData } from "../formatting/formatting";

export interface ListTableProps {
  vtableProps?: React.ComponentProps<typeof VListTable>;
  queryId?: string;
  data?: ExecuteQueryResponse;
  formatting?: PanelFormattingConfig;
}

interface TableTransformResult {
  columns: Array<{
    title: string;
    field: string;
    width: "auto";
    headerStyle: { textAlign: "left" };
    fieldFormat: (record: Record<string, unknown>) => string | number;
  }>;
  records: Array<Record<string, unknown>>;
}

const transformData = (
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

export const ListTable: React.FC<ListTableProps> = ({
  vtableProps = {},
  queryId,
  data,
  formatting,
}) => {
  const { mutate: executeQuery } = useExecuteQuery();
  const [tableOption, setTableOption] = useState(() => ({
    ...vtableProps.option,
    autoFillWidth: true,
  }));

  useEffect(() => {
    if (!queryId && !data) {
      return;
    }

    if (data) {
      const transformed = transformData(data, formatting);
      setTableOption((prev) => ({
        ...prev,
        ...transformed,
      }));
      return;
    }

    if (!queryId) {
      return;
    }

    executeQuery(queryId, {
      onSuccess: (queryData) => {
        console.log("hcs queryData", queryData);
        const transformed = transformData(queryData, formatting);
        setTableOption((prev) => ({
          ...prev,
          ...transformed,
        }));
      },
    });
  }, [data, executeQuery, formatting, queryId]);

  const option = useMemo(
    () => ({
      ...tableOption,
      autoFillWidth: true,
    }),
    [tableOption],
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <VListTable option={option} />
    </div>
  );
};
