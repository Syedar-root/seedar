import type {
  ExecuteQueryResponse,
  PanelFormattingConfig,
  PanelFormattingRole,
  PanelFormattingSurface,
  PanelSimpleFormattingConfig,
  PanelSimpleFormattingRule,
  QueryColumnMapping,
} from '#pkg/seedar/types';

interface ResolveFormatterParams {
  surface: PanelFormattingSurface;
  role: PanelFormattingRole;
  mapping?: QueryColumnMapping;
}

interface PanelFormatterResolver {
  findMappingByField: (field: string | undefined) => QueryColumnMapping | undefined;
  format: (value: unknown, params: ResolveFormatterParams) => string | number;
}

interface ApplyFormattingToQueryDataOptions {
  preserveMetricNumber?: boolean;
  surface?: PanelFormattingSurface;
}

const DEFAULT_SIMPLE_FORMATTING_CONFIG: PanelSimpleFormattingConfig = {
  version: 3,
  nullText: '--',
  locale: { mode: 'browser', value: null },
  timeZone: { mode: 'browser', value: null },
  rules: [],
};

const cloneFormattingConfig = (
  formatting?: PanelFormattingConfig,
): PanelSimpleFormattingConfig => {
  if (formatting?.version === 3) {
    return JSON.parse(JSON.stringify(formatting)) as PanelSimpleFormattingConfig;
  }

  return JSON.parse(
    JSON.stringify(DEFAULT_SIMPLE_FORMATTING_CONFIG),
  ) as PanelSimpleFormattingConfig;
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const toDate = (value: unknown): Date | undefined => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }
  return undefined;
};

const getRuntimeLocale = (config: PanelSimpleFormattingConfig): string | undefined =>
  config.locale.mode === 'fixed' ? config.locale.value || undefined : undefined;

const getRuntimeTimeZone = (config: PanelSimpleFormattingConfig): string | undefined =>
  config.timeZone.mode === 'fixed' ? config.timeZone.value || undefined : undefined;

const matchTarget = (
  expected: PanelSimpleFormattingRule['target'] | undefined,
  mapping?: QueryColumnMapping,
): boolean => {
  if (!expected) {
    return true;
  }
  if (!mapping?.target) {
    return false;
  }

  const actual = mapping.target;
  if (expected.kind && actual.kind !== expected.kind) {
    return false;
  }
  if (expected.datasetId !== undefined && actual.datasetId !== expected.datasetId) {
    return false;
  }
  if (expected.id !== undefined && actual.id !== expected.id) {
    return false;
  }
  if (expected.key !== undefined && actual.key !== expected.key) {
    return false;
  }
  return true;
};

const resolveSimpleRule = (
  config: PanelSimpleFormattingConfig,
  params: ResolveFormatterParams,
): PanelSimpleFormattingRule | undefined => {
  for (const rule of config.rules) {
    if (rule.enabled === false) {
      continue;
    }
    if (rule.role !== params.role) {
      continue;
    }
    if (!matchTarget(rule.target, params.mapping)) {
      continue;
    }
    return rule;
  }

  return undefined;
};

const formatBySimpleRule = (
  value: unknown,
  rule: PanelSimpleFormattingRule,
  config: PanelSimpleFormattingConfig,
): string | number => {
  if (value === null || value === undefined || value === '') {
    return config.nullText;
  }

  const locale = getRuntimeLocale(config);
  const timeZone = getRuntimeTimeZone(config);
  if (rule.kind === 'date' || rule.kind === 'datetime') {
    const date = toDate(value);
    if (!date) {
      return String(value);
    }

    if (rule.kind === 'date') {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeZone,
      }).format(date);
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone,
    }).format(date);
  }

  const baseNumber = toNumber(value);
  if (baseNumber === undefined) {
    return String(value);
  }

  const decimals = rule.decimals;
  const useGrouping = rule.useGrouping ?? true;

  if (rule.kind === 'percent') {
    const numericInput = rule.percentInput === 'percent' ? baseNumber / 100 : baseNumber;
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      useGrouping,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numericInput);
  }

  if (rule.kind === 'currency') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: rule.currency || 'CNY',
      currencyDisplay: 'symbol',
      useGrouping,
      minimumFractionDigits: decimals ?? 2,
      maximumFractionDigits: decimals ?? 2,
    }).format(baseNumber);
  }

  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    useGrouping,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(baseNumber);
};

const normalizeColumnMappings = (
  columnMappings?: QueryColumnMapping[],
): QueryColumnMapping[] => {
  if (!Array.isArray(columnMappings)) {
    return [];
  }
  return columnMappings;
};

const normalizeColumnMappingsFromData = (
  data: ExecuteQueryResponse,
): QueryColumnMapping[] => {
  if (Array.isArray(data.columnMappings) && data.columnMappings.length > 0) {
    return data.columnMappings;
  }

  const headers = data.results?.header || [];
  return headers.map((header, index) => ({
    alias: `col_${index}`,
    type: 'dimension',
    displayName: header,
    businessName: header,
    index,
    target: { kind: 'unknown' },
  }));
};

export const createPanelFormatterResolver = (options: {
  formatting?: PanelFormattingConfig;
  columnMappings?: QueryColumnMapping[];
}): PanelFormatterResolver => {
  const config = cloneFormattingConfig(options.formatting);
  const columnMappings = normalizeColumnMappings(options.columnMappings);

  const findMappingByField = (field: string | undefined): QueryColumnMapping | undefined => {
    if (!field) {
      return undefined;
    }

    return columnMappings.find(
      (mapping) =>
        mapping.alias === field ||
        mapping.displayName === field ||
        mapping.businessName === field,
    );
  };

  const format = (value: unknown, params: ResolveFormatterParams): string | number => {
    const rule = resolveSimpleRule(config, params);

    if (!rule) {
      if (value === null || value === undefined || value === '') {
        return config.nullText;
      }
      return typeof value === 'string' || typeof value === 'number'
        ? value
        : String(value);
    }

    return formatBySimpleRule(value, rule, config);
  };

  return {
    findMappingByField,
    format,
  };
};

export const applyFormattingToQueryData = (
  data: ExecuteQueryResponse,
  formatting?: PanelFormattingConfig,
  options?: ApplyFormattingToQueryDataOptions,
): ExecuteQueryResponse => {
  if (!formatting) {
    return data;
  }

  const columnMappings = normalizeColumnMappingsFromData(data);
  const resolver = createPanelFormatterResolver({
    formatting,
    columnMappings,
  });

  const surface = options?.surface || 'table_cell';
  const preserveMetricNumber = options?.preserveMetricNumber ?? false;

  const rows: unknown[][] = Array.isArray(data.results?.rows)
    ? (data.results.rows as unknown[][])
    : [];

  const nextRows = rows.map((row: unknown[]) =>
    row.map((cell, index) => {
      const mapping = columnMappings[index];
      if (!mapping) {
        return cell;
      }

      if (preserveMetricNumber && mapping.type === 'metric') {
        return cell;
      }

      return resolver.format(cell, {
        surface,
        role: mapping.type,
        mapping,
      });
    }),
  );

  return {
    ...data,
    results: {
      ...data.results,
      rows: nextRows,
    },
    columnMappings,
  };
};
