import type {
  BaseDimensionDSL,
  DatasetFieldResponse,
  PanelResponse,
  TimeGrainDimensionDSL,
} from "#pkg/seedar/types";
import {
  CHART_EDITOR_ADVANCED_SPEC_KEY,
  CHART_EDITOR_MODE_KEY,
  SUPPORTED_CHART_SPEC_TYPES,
} from "../components/panelEditor/chartSpec";
import type { ChartType, DisplayPanelType } from "../components/panelEditor";
import type {
  DerivedDimensionInput,
  DimensionItem,
  PanelDimensionDsl,
  QueryDsl,
} from "../types";

const VALID_TIME_GRAINS = ["day", "week", "month", "quarter", "year"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  return undefined;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const next = value.trim();
  return next.length > 0 ? next : undefined;
};

const asPrimitiveArray = (
  value: unknown,
): Array<string | number | boolean> | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const next = value.filter(
    (entry): entry is string | number | boolean =>
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean",
  );

  return next.length > 0 ? next : undefined;
};

export const VISUAL_CHART_SPEC_KEYS = new Set<string>([
  "type",
  "color",
  "label",
  "legends",
  "axes",
  "line",
  "direction",
  "xField",
  "yField",
  "seriesField",
  "categoryField",
  "valueField",
  "sizeField",
  "formatting",
]);

export const mapPanelTypeToDisplayType = (
  panelData?: PanelResponse,
): DisplayPanelType => {
  if (!panelData) {
    return "table";
  }

  if (panelData.type === "table") {
    return "table";
  }

  if (panelData.type === "card") {
    return "card";
  }

  const panelConfig = panelData.config as Record<string, unknown> | undefined;
  const configType = panelConfig?.type;
  if (
    typeof configType === "string" &&
    SUPPORTED_CHART_SPEC_TYPES.includes(configType as ChartType)
  ) {
    return configType as DisplayPanelType;
  }

  return "line";
};

export const stripChartEditorMeta = (
  value: Record<string, unknown>,
): Record<string, unknown> => {
  const next = { ...value };
  delete next[CHART_EDITOR_MODE_KEY];
  delete next[CHART_EDITOR_ADVANCED_SPEC_KEY];
  return next;
};

export const parseDimensionDsl = (
  value: unknown,
): PanelDimensionDsl | undefined => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return { fieldId: value };
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const derivedKind = value.derivedKind;

  if (derivedKind === undefined) {
    const fieldId = asNumber(value.fieldId);
    if (fieldId === undefined) {
      return undefined;
    }

    return {
      fieldId,
      alias: asString(value.alias),
    };
  }

  if (typeof derivedKind !== "string") {
    return undefined;
  }

  const alias = asString(value.alias);
  if (!alias) {
    return undefined;
  }

  if (derivedKind === "time_grain") {
    const fieldId = asNumber(value.fieldId);
    const grain = asString(value.grain);
    if (
      fieldId === undefined ||
      !grain ||
      !VALID_TIME_GRAINS.includes(grain)
    ) {
      return undefined;
    }

    return {
      derivedKind: "time_grain",
      fieldId,
      grain: grain as TimeGrainDimensionDSL["grain"],
      alias,
    } as DerivedDimensionInput;
  }

  if (derivedKind === "bucket") {
    const fieldId = asNumber(value.fieldId);
    if (fieldId === undefined || !Array.isArray(value.ranges)) {
      return undefined;
    }

    const ranges = value.ranges
      .map((range) => {
        if (!isRecord(range)) {
          return undefined;
        }

        const lt = asNumber(range.lt);
        const label = asString(range.label);

        if (lt === undefined || !label) {
          return undefined;
        }

        return { lt, label };
      })
      .filter(
        (
          range,
        ): range is {
          lt: number;
          label: string;
        } => Boolean(range),
      );

    if (ranges.length === 0) {
      return undefined;
    }

    return {
      derivedKind: "bucket",
      fieldId,
      ranges,
      defaultLabel: asString(value.defaultLabel),
      alias,
    };
  }

  if (derivedKind === "mapping") {
    const fieldId = asNumber(value.fieldId);
    if (fieldId === undefined || !Array.isArray(value.rules)) {
      return undefined;
    }

    const rules = value.rules
      .map((rule) => {
        if (!isRecord(rule)) {
          return undefined;
        }

        const valueList = asPrimitiveArray(rule.in);
        const label = asString(rule.label);

        if (!valueList || !label) {
          return undefined;
        }

        return { in: valueList, label };
      })
      .filter(
        (
          rule,
        ): rule is {
          in: Array<string | number | boolean>;
          label: string;
        } => Boolean(rule),
      );

    if (rules.length === 0) {
      return undefined;
    }

    return {
      derivedKind: "mapping",
      fieldId,
      rules,
      defaultLabel: asString(value.defaultLabel),
      alias,
    };
  }

  if (derivedKind === "expression") {
    const expression = asString(value.expression);
    if (!expression) {
      return undefined;
    }

    return {
      derivedKind: "expression",
      expression,
      alias,
    };
  }

  return undefined;
};

export const isDerivedDimensionDsl = (
  value: PanelDimensionDsl,
): value is DerivedDimensionInput =>
  typeof (value as DerivedDimensionInput).derivedKind === "string";

export const getFieldById = (
  fields: DatasetFieldResponse[],
  fieldId: number | undefined,
): DatasetFieldResponse | undefined => {
  if (fieldId === undefined) {
    return undefined;
  }

  return fields.find((field) => field.id === fieldId);
};

export const buildBaseDimensionItem = (options: {
  dimensionDsl: BaseDimensionDSL;
  datasetFields: DatasetFieldResponse[];
  id?: string | number;
}): DimensionItem => {
  const { dimensionDsl, datasetFields, id } = options;
  const sourceField = getFieldById(datasetFields, dimensionDsl.fieldId);
  const alias = asString(dimensionDsl.alias);
  const fallbackName = `field_${dimensionDsl.fieldId}`;

  return {
    id: id ?? dimensionDsl.fieldId,
    name: sourceField?.name || fallbackName,
    // Base 维度始终使用数据集字段名（优先 businessName）作为展示/映射名，
    // 避免 workflow 传入的 alias 与查询返回 header 不一致导致图表字段映射失配。
    businessName: sourceField?.businessName || sourceField?.name || fallbackName,
    fieldType: sourceField?.type,
    isDerived: false,
    dimensionDsl: {
      fieldId: dimensionDsl.fieldId,
      alias,
    },
  };
};

export const buildDerivedDimensionItem = (options: {
  dimensionDsl: DerivedDimensionInput;
  datasetFields: DatasetFieldResponse[];
  id?: string | number;
  nextId?: () => string | number;
}): DimensionItem => {
  const { dimensionDsl, datasetFields, id, nextId } = options;
  const fieldId = "fieldId" in dimensionDsl ? dimensionDsl.fieldId : undefined;
  const sourceField = getFieldById(datasetFields, fieldId);

  return {
    id: id ?? nextId?.() ?? `derived_dimension_${Date.now()}`,
    name: dimensionDsl.alias,
    businessName: dimensionDsl.alias,
    fieldType: sourceField?.type,
    isDerived: true,
    derivedKind: dimensionDsl.derivedKind,
    dimensionDsl,
  };
};

export const hydrateDimensions = (
  dimensions: QueryDsl["dimensions"] | undefined,
  datasetFields: DatasetFieldResponse[],
): DimensionItem[] => {
  if (!Array.isArray(dimensions)) {
    return [];
  }

  return dimensions
    .map((dimension, index) => {
      const parsed = parseDimensionDsl(dimension);
      if (!parsed) {
        return undefined;
      }

      if (isDerivedDimensionDsl(parsed)) {
        return buildDerivedDimensionItem({
          dimensionDsl: parsed,
          datasetFields,
          id: `derived_dimension_${index}_${parsed.derivedKind}_${parsed.alias}`,
        });
      }

      return buildBaseDimensionItem({
        dimensionDsl: parsed,
        datasetFields,
      });
    })
    .filter((dimension): dimension is DimensionItem => Boolean(dimension));
};

export const serializeDimensions = (
  dimensions: DimensionItem[],
): PanelDimensionDsl[] => {
  return dimensions.map((dimension) => {
    if (dimension.isDerived && isDerivedDimensionDsl(dimension.dimensionDsl)) {
      return dimension.dimensionDsl;
    }

    return {
      fieldId: (dimension.dimensionDsl as BaseDimensionDSL).fieldId,
      alias: asString((dimension.dimensionDsl as BaseDimensionDSL).alias),
    };
  });
};
