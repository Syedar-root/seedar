import { useMemo } from 'react';
import { LineChart as VLineChart } from '@visactor/react-vchart';
import type { LineChartProps } from '../../types/chart';

export const LineChart: React.FC<LineChartProps> = (props) => {
  const { data, width, height, xField, yField, seriesName = '数据' } = props;

  const chartOption = useMemo(
    () => ({
      data: {
        values: data,
      },
      series: [
        {
          type: 'line' as const,
          xField,
          yField,
          seriesField: seriesName,
        },
      ],
    }),
    [data, xField, yField, seriesName]
  );

  return <VLineChart {...chartOption} width={width} height={height} />;
};
