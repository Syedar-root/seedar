import { useMemo } from 'react';
import { PieChart as VPieChart } from '@visactor/react-vchart';
import type { PieChartProps } from '../../types/chart';

export const PieChart: React.FC<PieChartProps> = (props) => {
  const { data, width, height, categoryField, valueField } = props;

  const chartOption = useMemo(
    () => ({
      data: {
        values: data,
      },
      series: [
        {
          type: 'pie' as const,
          categoryField,
          valueField,
        },
      ],
    }),
    [data, categoryField, valueField]
  );

  return <VPieChart {...chartOption} width={width} height={height} />;
};
