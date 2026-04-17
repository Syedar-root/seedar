import type { ChartDataPoint } from "../types";

const DEFAULT_LINE_WIDTH = 2;
const DEFAULT_POINT_SIZE = 5;

interface ChartConfigOptions {
  chartData: ChartDataPoint[];
  chartColor: string;
  chartSmooth: boolean;
  chartHighlightKeys: Array<string | number>;
}

interface ChartConfigResult {
  spec: Record<string, unknown> & { type: "line" };
  isHighlighted: (x: string | number) => boolean;
}

export function generateChartConfig(
  options: ChartConfigOptions,
): ChartConfigResult {
  const { chartData, chartColor, chartSmooth, chartHighlightKeys } = options;

  const isHighlighted = (x: string | number): boolean =>
    chartHighlightKeys.length > 0 && chartHighlightKeys.includes(x);

  const baseAxis = {
    domainLine: { visible: false },
    label: { visible: false },
    grid: { visible: true },
  };

  const spec = {
    type: "line" as const,
    data: [{ id: "lineData", values: chartData }],
    xField: "x",
    yField: "y",
    line: {
      style: {
        stroke: chartColor,
        lineWidth: DEFAULT_LINE_WIDTH,
        curveType: chartSmooth ? "monotone" : "linear",
      },
    },
    point: {
      style: {
        fill: chartColor,
        size: (datum: { x: string | number }) =>
          isHighlighted(datum.x) ? DEFAULT_POINT_SIZE : 0,
        stroke: (datum: { x: string | number }) =>
          isHighlighted(datum.x) ? chartColor : "transparent",
      },
    },
    label: {
      visible: true,
      position: "top",
      style: (datum: { x: string | number }) =>
        isHighlighted(datum.x)
          ? { fill: chartColor, fontSize: 11, fontWeight: 500 }
          : { fill: "transparent", fontSize: 0 },
      formatMethod: (datum: { y: number }) => datum.y,
    },
    axes: [
      { orient: "bottom", ...baseAxis, tick: { tickCount: chartData.length } },
      {
        orient: "left",
        ...baseAxis,
        tick: { tickCount: 5 },
        max: Math.max(...chartData.map((item) => item.y)) * 1.2,
        min: Math.min(...chartData.map((item) => item.y)) * 0.8,
      },
    ],
    padding: { left: 5, right: 5 },
    background: "transparent",
    animation: false,
  };

  return { spec, isHighlighted };
}
