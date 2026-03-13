import { ListTable as VListTable } from '@visactor/react-vtable';
import { useEffect, useState } from 'react';
import { useExecuteQuery } from '../../hooks';
import { ExecuteQueryResponse } from '#pkg/seedar/types';

export interface ListTableProps {
  vtableProps?: React.ComponentProps<typeof VListTable>;
  queryId?: number;
}

export const ListTable: React.FC<ListTableProps> = (props) => {
  const { vtableProps = {}, queryId } = props;
  const { mutate: executeQuery } = useExecuteQuery();

  // 使用 useState 管理 option
  const [tableOption, setTableOption] = useState(vtableProps.option);
  useEffect(() => {
    if (!queryId) {
      return;
    }
    executeQuery(queryId, {
      onSuccess: (data) => {
        const newData = transformData(data);
        setTableOption(newData);
      },
    });
  }, [queryId]);
  return (
    <VListTable
      option={tableOption}
      width={'100%'}
      height={'500px'}
      {...vtableProps}
    />
  );
};

const transformData = (data: ExecuteQueryResponse) => {
  return {
    columns:
      data.results.header.map((item, index) => ({
        title: item,
        field: `${index}`,
        width: `${(1 / data.results.header.length) * 100}%`,
      })) || [],
    records:
      data?.results?.rows.map((item) => ({
        ...item,
      })) || [],
  };
};
