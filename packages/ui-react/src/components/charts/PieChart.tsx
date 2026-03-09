import { useMemo } from 'react';
import { ReactVChart } from '@visactor/react-vchart';
import type { PieChartProps } from '@seedar/ui-core';
import { DEFAULT_CHART_CONFIG } from '@seedar/ui-core';

export const PieChart: React.FC<PieChartProps> = (props) => {
  const {
    data,
    width,
    height,
    categoryField,
    valueField,
  } = props;

  const chartOption = useMemo(
    () => ({
      ...DEFAULT_CHART_CONFIG,
      type: 'pie',
      data: {
        values: data,
      },
      categoryField,
      valueField,
    }),
    [data, categoryField, valueField]
  );

  return <ReactVChart option={chartOption} width={width} height={height} />;
};
