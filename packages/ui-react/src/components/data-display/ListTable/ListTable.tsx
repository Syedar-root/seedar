import { ListTable as VListTable } from "@visactor/react-vtable";
import { useListTableData } from "./hooks/useListTableData.hook";
import type { ListTableProps } from "./types";

export const ListTable: React.FC<ListTableProps> = ({
  vtableProps = {},
  queryId,
  data,
  formatting,
}) => {
  const option = useListTableData({
    vtableProps,
    queryId,
    data,
    formatting,
  });

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
