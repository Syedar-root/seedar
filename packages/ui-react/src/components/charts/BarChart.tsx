import { useMemo } from 'react';
import { BarChart as VBarChart } from '@visactor/react-vchart';
import type { BarChartProps } from '../../types/chart';

export const BarChart: React.FC<BarChartProps> = (props) => {
  const { data, width, height, xField, yField, seriesName = '数据' } = props;

  const chartOption = useMemo(
    () => ({
      data: {
        values: data,
      },
      series: [
        {
          type: 'bar' as const,
          xField,
          yField,
          seriesField: seriesName,
        },
      ],
    }),
    [data, xField, yField, seriesName]
  );

  return <VBarChart {...chartOption} width={width} height={height} />;
};
