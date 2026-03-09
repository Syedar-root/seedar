import type { ThemeType } from '../config/theme';

export type ChartData = Record<string, any>[];

export type ChartSize = number | string;

export interface BaseChartProps {
  data: ChartData;
  width?: ChartSize;
  height?: ChartSize;
  theme?: ThemeType;
  padding?: number[];
}

export interface LineChartProps extends BaseChartProps {
  xField: string;
  yField: string;
  seriesName?: string;
}

export interface BarChartProps extends BaseChartProps {
  xField: string;
  yField: string;
  seriesName?: string;
}

export interface PieChartProps extends BaseChartProps {
  categoryField: string;
  valueField: string;
}
