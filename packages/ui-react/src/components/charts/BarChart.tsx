import { useMemo } from 'react';
import { ReactVChart } from '@visactor/react-vchart';
import type { BarChartProps } from '@seedar/ui-core';
import { DEFAULT_CHART_CONFIG } from '@seedar/ui-core';

export const BarChart: React.FC<BarChartProps> = (props) => {
  const {
    data,
    width,
    height,
    xField,
    yField,
    seriesName = '数据',
  } = props;

  const chartOption = useMemo(
    () => ({
      ...DEFAULT_CHART_CONFIG,
      type: 'bar',
      data: {
        values: data,
      },
      xField,
      yField,
      series: [{ name: seriesName, type: 'bar' }],
    }),
    [data, xField, yField, seriesName]
  );

  return <ReactVChart option={chartOption} width={width} height={height} />;
};
