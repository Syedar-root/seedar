/**
 * 图表尺寸类型
 * 只支持数字（像素值）
 */
export type ChartSize = number;

/**
 * 图表数据类型
 * 使用 Record<string, any>[] 表示通用的数据数组结构
 */
export type ChartData = Record<string, any>[];

/**
 * 基础图表属性接口
 * 所有图表组件的通用属性
 */
export interface BaseChartProps {
  /** 图表数据 */
  data: ChartData;
  /** 图表宽度，可选 */
  width?: ChartSize;
  /** 图表高度，可选 */
  height?: ChartSize;
  /** 图表主题，可选 */
  theme?: string;
  /** 图表内边距，可选，数组格式 [top, right, bottom, left] */
  padding?: number[];
}

/**
 * 折线图属性接口
 * 继承基础图表属性，添加折线图特有属性
 */
export interface LineChartProps extends BaseChartProps {
  /** X轴字段名 */
  xField: string;
  /** Y轴字段名 */
  yField: string;
  /** 系列名称，可选 */
  seriesName?: string;
}

/**
 * 柱状图属性接口
 * 继承基础图表属性，添加柱状图特有属性
 */
export interface BarChartProps extends BaseChartProps {
  /** X轴字段名 */
  xField: string;
  /** Y轴字段名 */
  yField: string;
  /** 系列名称，可选 */
  seriesName?: string;
}

/**
 * 饼图属性接口
 * 继承基础图表属性，添加饼图特有属性
 */
export interface PieChartProps extends BaseChartProps {
  /** 分类字段名 */
  categoryField: string;
  /** 数值字段名 */
  valueField: string;
}
