import { ListTable as VListTable } from '@visactor/react-vtable';
import { useEffect, useRef, useState } from 'react';
import { useExecuteQuery } from '../../hooks';
import { ExecuteQueryResponse } from '#pkg/seedar/types';

export interface ListTableProps {
  vtableProps?: React.ComponentProps<typeof VListTable>;
  queryId?: string;
}

export const ListTable: React.FC<ListTableProps> = (props) => {
  const { vtableProps = {}, queryId } = props;
  const { mutate: executeQuery } = useExecuteQuery();
  const tableRef = useRef<any>(null);

  // 初始化表格配置：自动高度 + 关闭分页
  const [tableOption, setTableOption] = useState({
    ...vtableProps.option,
  });

  // 请求数据
  useEffect(() => {
    if (!queryId) return;

    executeQuery(queryId, {
      onSuccess: (data) => {
        const transformed = transformData(data);
        setTableOption({
          height: 'auto',
          ...transformed,
          ...vtableProps.option,
        });
      },
    });
  }, [queryId, vtableProps.option]);

  // ✅ 修复：React 版必须用 .table 才是真实实例
  useEffect(() => {
    console.log(tableRef.current);
    if (tableRef.current?.table) {
      // 正确写法！
      const realHeight = tableRef.current.table.getTableHeight();
      console.log('表格真实高度：', realHeight);
    }
  }, [tableOption]);

  return (
    <VListTable
      ref={tableRef}
      option={tableOption}
      width="100%"
      // ✅ 关键：绝对不要写 height="100%"
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
    records: data?.results?.rows || [],
  };
};
