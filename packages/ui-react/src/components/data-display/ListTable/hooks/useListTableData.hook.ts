import { useEffect, useMemo, useState } from "react";

import { useQueryExecution } from "../../../../hooks";
import type { ListTableProps } from "../types";
import { transformTableData } from "../utils/transformTableData";

export const useListTableData = ({
  data,
  formatting,
  queryId,
  vtableProps = {},
}: ListTableProps) => {
  const { data: executedData } = useQueryExecution(queryId, !data);
  const [tableOption, setTableOption] = useState(() => ({
    ...vtableProps.option,
    autoFillWidth: true,
  }));

  useEffect(() => {
    const tableData = data || executedData;

    if (!queryId && !tableData) {
      return;
    }

    if (tableData) {
      const transformed = transformTableData(tableData, formatting);
      setTableOption((prev) => ({
        ...prev,
        ...transformed,
      }));
    }
  }, [data, executedData, formatting, queryId]);

  return useMemo(
    () => ({
      ...tableOption,
      autoFillWidth: true,
    }),
    [tableOption],
  );
};
