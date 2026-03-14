import { ExecuteQueryResponse } from '#pkg/seedar/types';
import {
  IChartSpec,
  IPieChartSpec,
  IBarChartSpec,
  ILineChartSpec,
  IAreaChartSpec,
  IScatterChartSpec,
  IRadarChartSpec,
  IRoseChartSpec,
  IFunnelChartSpec,
  IGaugeChartSpec,
  ISpec,
} from '@visactor/vchart';

type ChartType =
  | 'pie'
  | 'bar'
  | 'line'
  | 'area'
  | 'scatter'
  | 'radar'
  | 'rose'
  | 'funnel';

type TransformStrategy<T extends ISpec = ISpec> = (
  data: Record<string, any>[],
  spec: T
) => T;

const farmatField = (field: string | string[]) => {
  if (Array.isArray(field)) {
    return field[0];
  }
  return field;
};

const sqlResultToObjects = (
  results: ExecuteQueryResponse['results']
): Record<string, any>[] => {
  if (!results?.header || !results?.rows) {
    return [];
  }

  const { header, rows } = results;
  return rows.map((row) => {
    const obj: Record<string, any> = {};
    header.forEach((col, index) => {
      obj[col] = row[index];
    });
    return obj;
  });
};

const transformForPie = <T extends IPieChartSpec | IRoseChartSpec>(
  data: Record<string, any>[],
  spec: T
): T => {
  const categoryField = farmatField(spec.categoryField ?? 'category');
  const valueField = farmatField(spec.valueField ?? 'value');

  const values = data.map((item) => ({
    [categoryField]: item[categoryField],
    [valueField]: item[valueField],
  }));

  return { ...spec, data: [{ id: 'data', values }] };
};

const transformForCartesian = <
  T extends IBarChartSpec | ILineChartSpec | IAreaChartSpec
>(
  data: Record<string, any>[],
  spec: T
): T => {
  const xField = farmatField(spec.xField ?? 'x');
  const yField = farmatField(spec.yField ?? 'y');
  const seriesField = spec.seriesField;

  const values = data.map((item) => {
    const result: Record<string, any> = {
      [xField]: item[xField],
      [yField]: item[yField],
    };
    if (seriesField && item[seriesField] !== undefined) {
      result[seriesField] = item[seriesField];
    }
    return result;
  });

  return { ...spec, data: [{ id: 'data', values }] };
};

const transformForRadar = <T extends IRadarChartSpec>(
  data: Record<string, any>[],
  spec: T
): T => {
  const categoryField = farmatField(spec.categoryField ?? 'category');
  const valueField = farmatField(spec.valueField ?? 'value');
  const seriesField = spec.seriesField;

  const values = data.map((item) => {
    const result: Record<string, any> = {
      [categoryField]: item[categoryField],
      [valueField]: item[valueField],
    };
    if (seriesField && item[seriesField] !== undefined) {
      result[seriesField] = item[seriesField];
    }
    return result;
  });

  return { ...spec, data: [{ id: 'data', values }] };
};

const transformForScatter = <T extends IScatterChartSpec>(
  data: Record<string, any>[],
  spec: T
): T => {
  const xField = farmatField(spec.xField ?? 'x');
  const yField = farmatField(spec.yField ?? 'y');
  const sizeField = spec.sizeField;
  const seriesField = spec.seriesField;

  const values = data.map((item) => {
    const result: Record<string, any> = {
      [xField]: item[xField],
      [yField]: item[yField],
    };
    if (sizeField && item[sizeField] !== undefined) {
      result[sizeField] = item[sizeField];
    }
    if (seriesField && item[seriesField] !== undefined) {
      result[seriesField] = item[seriesField];
    }
    return result;
  });

  return { ...spec, data: [{ id: 'data', values }] };
};

const transformForFunnel = <T extends IFunnelChartSpec>(
  data: Record<string, any>[],
  spec: T
): T => {
  const categoryField = spec.categoryField ?? 'category';
  const valueField = spec.valueField ?? 'value';

  const values = data.map((item) => ({
    [categoryField]: item[categoryField],
    [valueField]: item[valueField],
  }));

  return { ...spec, data: [{ id: 'data', values }] };
};

const transformStrategies: Record<ChartType, TransformStrategy> = {
  pie: transformForPie as TransformStrategy,
  rose: transformForPie as TransformStrategy,
  bar: transformForCartesian as TransformStrategy,
  line: transformForCartesian as TransformStrategy,
  area: transformForCartesian as TransformStrategy,
  radar: transformForRadar as TransformStrategy,
  scatter: transformForScatter as TransformStrategy,
  funnel: transformForFunnel as TransformStrategy,
};

const transformData = <T extends ISpec>(
  data: ExecuteQueryResponse,
  spec: T
): T | undefined => {
  if (!spec?.type) {
    return undefined;
  }

  const rawData = sqlResultToObjects(data?.results);
  const chartType = spec.type as ChartType;

  const strategy = transformStrategies[chartType];
  return strategy
    ? (strategy(rawData, spec) as T)
    : { ...spec, data: [{ id: 'data', values: rawData }] };
};

export { transformData, sqlResultToObjects };
