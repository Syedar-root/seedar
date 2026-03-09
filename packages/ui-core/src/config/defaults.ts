import type { IChartSpec } from '@visactor/vchart';

export const DEFAULT_CHART_CONFIG: Partial<IChartSpec> = {
  padding: [16, 16, 16, 16],
  animation: {
    appear: { duration: 600, easing: 'cubicOut' },
  },
  tooltip: { visible: true, trigger: 'item' },
  legends: { visible: true },
};
