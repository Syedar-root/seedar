import { useEffect, useMemo, useState } from "react";

import { useExecuteQuery } from "../../../../hooks";
import type { ListTableProps } from "../types";
import { transformTableData } from "../utils/transformTableData";

export const useListTableData = ({
  data,
  formatting,
  queryId,
  vtableProps = {},
}: ListTableProps) => {
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
      const transformed = transformTableData(data, formatting);
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
        const transformed = transformTableData(queryData, formatting);
        setTableOption((prev) => ({
          ...prev,
          ...transformed,
        }));
      },
    });
  }, [data, executeQuery, formatting, queryId]);

  return useMemo(
    () => ({
      ...tableOption,
      autoFillWidth: true,
    }),
    [tableOption],
  );
};
