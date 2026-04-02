import { ListTable as VListTable } from '@visactor/react-vtable';
import { useEffect, useRef, useState } from 'react';
import { useExecuteQuery } from '../../hooks';
import { ExecuteQueryResponse } from '#pkg/seedar/types';

export interface ListTableProps {
  vtableProps?: React.ComponentProps<typeof VListTable>;
  queryId?: string;
  data?: ExecuteQueryResponse;
}

export const ListTable: React.FC<ListTableProps> = (props) => {
  const { vtableProps = {}, queryId, data } = props;
  const { mutate: executeQuery } = useExecuteQuery();

  // 🔥 修复1：修正ref类型 → 指向VListTable组件实例（不是div）
  const tableRef = useRef<any>(null);
  // 🔥 修复2：新增父容器ref，用于监听尺寸变化
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化表格配置
  const [tableOption, setTableOption] = useState({
    ...vtableProps.option,
    autoFillWidth: true,
  });

  // 数据请求 + 配置更新
  useEffect(() => {

    if (data) {
      const transformed = transformData(data);
      setTableOption((prev) => ({
        ...prev,
        ...transformed,
      }));
      return;
    }

    if (!queryId) return;

    executeQuery(queryId, {
      onSuccess: (data) => {
        const transformed = transformData(data);
        setTableOption((prev) => ({
          ...prev,
          ...transformed,
        }));
      },
    });
  }, [queryId, vtableProps.option, data]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 防抖：避免频繁重绘（100ms延迟，可调整）
    let timer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // if (data) {
        //   console.log('data', data);
        //   const transformed = transformData(data);
        //   setTableOption((prev) => ({
        //     ...prev,
        //     ...transformed,
        //   }));
        // }
        // tableRef.current?.renderWithRecreateCells();
      }, 300);
    };

    // 监听父容器尺寸
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 清理监听（防止内存泄漏）
    return () => {
      clearTimeout(timer);
      resizeObserver.unobserve(container);
      resizeObserver.disconnect();
    };
  }, []);

  // 🔥 修复5：移除错误的DOM高度获取，替换为正确的表格实例操作
  useEffect(() => {
    if (tableRef.current?.table) {
      const realTable = tableRef.current.table;
      console.log('表格真实高度：', realTable.getTableHeight());
      console.log('表格真实宽度：', realTable.getTableWidth());
    }
  }, [tableOption]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        // minHeight: '300px', // 最小高度，避免表格塌陷
      }}
    >
      <VListTable
        ref={tableRef}
        option={tableOption}
        // ✅ 自适应配置：宽度100%，自动填充父容器
        // width="100%"
        // {...vtableProps}
      />
    </div>
  );
};

// 数据转换函数（保持不变，优化空值兼容）
const transformData = (data: ExecuteQueryResponse) => {
  const headers = data.results?.header || [];
  return {
    columns: headers.map((item, index) => ({
      title: item,
      field: `${index}`,
      // width: `${(1 / headers.length) * 100}%`, // 等宽分列
      width: 'auto',
      headerStyle: { textAlign: 'left' }, // 可选：表头居中
    })),
    records: data?.results?.rows || [],
  };
};
