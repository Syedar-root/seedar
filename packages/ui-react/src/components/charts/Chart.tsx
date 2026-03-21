import { ExecuteQueryResponse } from '#pkg/seedar/ui-core';
import { ISpec, VChart } from '@visactor/react-vchart';
import { useEffect, useState } from 'react';
import { useExecuteQuery } from '../../hooks';
import { transformData } from './transformer';

export interface ChartProps {
  vchartProps?: React.ComponentProps<typeof VChart>;
  spec: ISpec;
  queryId?: string;
  data?: ExecuteQueryResponse;
}

export const Chart: React.FC<ChartProps> = (props) => {
  const { vchartProps = {}, spec = { type: 'bar' }, queryId, data } = props;
  const { mutate: executeQuery } = useExecuteQuery();

  const [rawData, setRawData] = useState<ExecuteQueryResponse>();
  const [specOption, setSpecOption] = useState<ISpec>({
    ...spec,
    autoFit: true,
  });

  // 仅在 queryId 变化时执行查询
  useEffect(() => {
    if (data) {
      setRawData(data);
      return;
    }
    if (!queryId) return;
    executeQuery(queryId, {
      onSuccess: (data) => {
        setRawData(data);
      },
    });
  }, [queryId, executeQuery, data]);

  // 仅在 rawData 或 spec 变化时转换数据
  useEffect(() => {
    if (!rawData || !spec) return;
    const transformed = transformData(rawData, spec);
    if (!transformed) return;
    setSpecOption(transformed);
  }, [rawData, spec]);

  return <VChart spec={specOption} {...vchartProps} />;
};
