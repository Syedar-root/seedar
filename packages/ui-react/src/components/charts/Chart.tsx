import { VChart } from '@visactor/react-vchart';

export interface ChartProps {
  vchartProps?: React.ComponentProps<typeof VChart>;
  queryId?: string | number;
}

export const Chart: React.FC<ChartProps> = (props) => {
  const { vchartProps } = props;
  return <VChart {...vchartProps} />;
};
