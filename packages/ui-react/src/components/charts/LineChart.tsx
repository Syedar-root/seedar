import { useMemo } from 'react';
import { ReactVChart } from '@visactor/react-vchart';
import type { LineChartProps } from '@seedar/ui-core';
import { DEFAULT_CHART_CONFIG } from '@seedar/ui-core';

export const LineChart: React.FC<LineChartProps> = (props) => {
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
      type: 'line',
      data: {
        values: data,
      },
      xField,
      yField,
      series: [{ name: seriesName, type: 'line' }],
    }),
    [data, xField, yField, seriesName]
  );

  return <ReactVChart option={chartOption} width={width} height={height} />;
};
