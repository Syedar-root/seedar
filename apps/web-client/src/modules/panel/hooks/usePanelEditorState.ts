import {
  useDataset,
  useExecuteTempQuery,
  usePanel,
  useQuery,
} from "#pkg/seedar/ui-react";
import {
  FieldType,
  type PanelFormattingConfig,
  type PanelFormattingRole,
  type PanelFormattingTarget,
  type PanelSimpleFormattingRule,
  PanelStatus,
  QueryDSL,
  PeriodOverPeriodType,
  PeriodCalculationMode,
  type BaseDimensionDSL,
  type DatasetFieldResponse,
  type DatasetResponse,
  type DerivedDimensionDSL,
  type ExecuteQueryResponse,
  type PanelResponse,
  type QueryDimensionDSL,
  type QueryResponse,
  type TimeGrainDimensionDSL,
} from "#pkg/seedar/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TitleConfig } from "../components/editableTitle";
import type { DragItem } from "../components/dndHelper/dragZone/dragZone";
import {
  DEFAULT_COLORS,
  DEFAULT_LEGENDS_CONFIG,
  DEFAULT_PANEL_FORMATTING_CONFIG,
  type DisplayPanelType,
  type PanelEditorConfig,
} from "../components/panelEditor";
import type { PeriodOverPeriodConfig } from "../components/queryZone/queryZone";
import type { FilterItem } from "../components/queryZone/types";
import {
  isSameFormattingTarget,
  toSimpleFormattingConfig,
} from "../utils/formatting";

type LocalPanelStatus = "unsaved" | PanelStatus.DRAFT | PanelStatus.PUBLISHED;
type QueryDsl = QueryDSL;
type PanelDimensionDsl = Exclude<QueryDimensionDSL, number>;

export type DerivedDimensionInput = DerivedDimensionDSL;

export interface DimensionItem extends DragItem {
  id: string | number;
  name: string;
  businessName?: string;
  isDerived: boolean;
  derivedKind?: DerivedDimensionInput["derivedKind"];
  fieldType?: FieldType;
  dimensionDsl: PanelDimensionDsl;
}

// 计算模式中文标签映射
const CALCULATION_MODE_LABELS: Record<PeriodCalculationMode, string> = {
  [PeriodCalculationMode.PERCENTAGE]: "增长率",
  [PeriodCalculationMode.ABSOLUTE]: "差值",
  [PeriodCalculationMode.BOTH]: "增长率+差值",
};

// 临时指标配置
export interface TempMetricConfig {
  id: string;
  type: "period_comparison";
  alias?: string;
  businessName?: string;
  baseMetricId: number;
  timeFieldId?: number;
  periodType?: PeriodOverPeriodType;
  calculationMode?: PeriodCalculationMode;
}

interface UsePanelEditorStateReturn {
  dimensionItems: DimensionItem[];
  dropFields: DragItem[];
  dropMetrics: DragItem[];
  dropFilters: FilterItem[];
  tempMetrics: TempMetricConfig[];
  displayType: DisplayPanelType;
  editorConfig: PanelEditorConfig;
  tempData: ExecuteQueryResponse | undefined;
  panelData: PanelResponse | undefined;
  queryData: QueryResponse | undefined;
  datasetData: DatasetResponse | undefined;
  selectedDataset: DatasetResponse | undefined;
  panelStatus: LocalPanelStatus;
  hasDataset: boolean;
  hasQueryContent: boolean;
  canRun: boolean;
  isPreviewRunning: boolean;
  selectDataset: (dataset: DatasetResponse) => void;
  replaceDataset: (dataset: DatasetResponse) => void;
  setPanelStatus: (status: LocalPanelStatus) => void;
  setTempData: (data: ExecuteQueryResponse | undefined) => void;
  buildDsl: (baseDsl?: QueryDsl) => QueryDsl | undefined;
  resetForDatasetChange: () => void;
  runPreview: (dsl?: QueryDsl) => Promise<ExecuteQueryResponse | undefined>;
  handleDropField: (item: DragItem) => void;
  handleRemoveField: (item: DragItem) => void;
  handleDropMetric: (item: DragItem) => void;
  handleRemoveMetric: (item: DragItem) => void;
  handleDropFilter: (item: DragItem) => void;
  handleRemoveFilter: (id: string | number) => void;
  handleUpdateFilter: (
    id: string | number,
    updates: Partial<FilterItem>,
  ) => void;
  handleAddDerivedDimension: (dimension: DerivedDimensionInput) => void;
  handleUpdateDerivedDimension: (
    dimensionItemId: string | number,
    dimension: DerivedDimensionInput,
  ) => void;
  handleUpdateTempMetric: (
    metricId: string | number,
    config: PeriodOverPeriodConfig | undefined,
  ) => void;
  handleRemoveTempMetric: (tempMetricId: string) => void;
  handleEditorChange: (
    type: DisplayPanelType,
    config: PanelEditorConfig,
  ) => void;
  handleSaveItemFormatting: (rule: PanelSimpleFormattingRule) => void;
  handleRemoveItemFormatting: (
    target: PanelFormattingTarget,
    role: PanelFormattingRole,
  ) => void;
  handleRun: () => void;
  title: string;
  titleConfig?: TitleConfig;
  handleTitleChange: (title: string, titleConfig?: TitleConfig) => void;
}

const mapPanelTypeToDisplayType = (
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

  const panelConfig = panelData.config as PanelEditorConfig | undefined;
  if (panelConfig?.type) {
    return panelConfig.type as DisplayPanelType;
  }

  return "line";
};

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

const parseDimensionDsl = (value: unknown): PanelDimensionDsl | undefined => {
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

const isDerivedDimensionDsl = (
  value: PanelDimensionDsl,
): value is DerivedDimensionInput =>
  typeof (value as DerivedDimensionInput).derivedKind === "string";

const getFieldById = (
  fields: DatasetFieldResponse[],
  fieldId: number | undefined,
): DatasetFieldResponse | undefined => {
  if (fieldId === undefined) {
    return undefined;
  }

  return fields.find((field) => field.id === fieldId);
};

export const usePanelEditorState = (
  panelId?: string,
): UsePanelEditorStateReturn => {
  const [dimensionItems, setDimensionItems] = useState<DimensionItem[]>([]);
  const [dropMetrics, setDropMetrics] = useState<DragItem[]>([]);
  const [dropFilters, setDropFilters] = useState<FilterItem[]>([]);
  const [tempMetrics, setTempMetrics] = useState<TempMetricConfig[]>([]);
  const [displayType, setDisplayType] = useState<DisplayPanelType>("table");
  const [editorConfig, setEditorConfig] = useState<PanelEditorConfig>({
    color: DEFAULT_COLORS,
    legends: DEFAULT_LEGENDS_CONFIG,
    formatting: DEFAULT_PANEL_FORMATTING_CONFIG,
  });
  const [tempData, setTempData] = useState<ExecuteQueryResponse>();
  const [title, setTitle] = useState("Untitled Panel");
  const [titleConfig, setTitleConfig] = useState<TitleConfig | undefined>();
  const [selectedDataset, setSelectedDataset] = useState<
    DatasetResponse | undefined
  >();
  const [panelStatus, setPanelStatus] = useState<LocalPanelStatus>(
    panelId ? PanelStatus.DRAFT : "unsaved",
  );

  const hydratedQueryRef = useRef<string | undefined>();
  const derivedDimensionSeedRef = useRef(0);

  const { data: panelData } = usePanel(panelId ?? "", !!panelId);
  const queryId = panelData?.queryId;
  const { data: queryData } = useQuery(queryId ?? "");
  const { data: remoteDatasetData } = useDataset(queryData?.datasetId ?? 0);
  const {
    mutate: executeTempQuery,
    mutateAsync: executeTempQueryAsync,
    isPending: isPreviewRunning,
  } = useExecuteTempQuery();

  const nextDerivedDimensionId = useCallback(() => {
    derivedDimensionSeedRef.current += 1;
    return `derived_dimension_${derivedDimensionSeedRef.current}_${Date.now()}`;
  }, []);

  const buildBaseDimensionItem = useCallback(
    (
      dimensionDsl: BaseDimensionDSL,
      datasetFields: DatasetFieldResponse[],
      id?: string | number,
    ): DimensionItem => {
      const sourceField = getFieldById(datasetFields, dimensionDsl.fieldId);
      const alias = asString(dimensionDsl.alias);
      const fallbackName = `field_${dimensionDsl.fieldId}`;

      return {
        id: id ?? dimensionDsl.fieldId,
        name: sourceField?.name || fallbackName,
        businessName: alias || sourceField?.businessName || sourceField?.name || fallbackName,
        fieldType: sourceField?.type,
        isDerived: false,
        dimensionDsl: {
          fieldId: dimensionDsl.fieldId,
          alias,
        },
      };
    },
    [],
  );

  const buildDerivedDimensionItem = useCallback(
    (
      dimensionDsl: DerivedDimensionInput,
      datasetFields: DatasetFieldResponse[],
      id?: string | number,
    ): DimensionItem => {
      const fieldId = "fieldId" in dimensionDsl ? dimensionDsl.fieldId : undefined;
      const sourceField = getFieldById(datasetFields, fieldId);

      return {
        id: id ?? nextDerivedDimensionId(),
        name: dimensionDsl.alias,
        businessName: dimensionDsl.alias,
        fieldType: sourceField?.type,
        isDerived: true,
        derivedKind: dimensionDsl.derivedKind,
        dimensionDsl,
      };
    },
    [nextDerivedDimensionId],
  );

  const hydrateDimensions = useCallback(
    (
      dimensions: QueryDsl["dimensions"] | undefined,
      dataset: DatasetResponse,
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
            return buildDerivedDimensionItem(
              parsed,
              dataset.fields,
              `derived_dimension_${index}_${parsed.derivedKind}_${parsed.alias}`,
            );
          }

          return buildBaseDimensionItem(parsed, dataset.fields);
        })
        .filter((dimension): dimension is DimensionItem => Boolean(dimension));
    },
    [buildBaseDimensionItem, buildDerivedDimensionItem],
  );

  const serializeDimensions = useCallback(
    (dimensions: DimensionItem[]): PanelDimensionDsl[] => {
      return dimensions.map((dimension) => {
        if (dimension.isDerived && isDerivedDimensionDsl(dimension.dimensionDsl)) {
          return dimension.dimensionDsl;
        }

        return {
          fieldId: (dimension.dimensionDsl as BaseDimensionDSL).fieldId,
          alias: asString((dimension.dimensionDsl as BaseDimensionDSL).alias),
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (!panelId) {
      setPanelStatus("unsaved");
      hydratedQueryRef.current = undefined;
      return;
    }

    if (panelData?.status) {
      setPanelStatus(panelData.status);
    }
  }, [panelData?.status, panelId]);

  useEffect(() => {
    if (!panelData) {
      return;
    }

    if (panelData.title) {
      setTitle(panelData.title);
    }

    if (panelData.titleConfig) {
      setTitleConfig(panelData.titleConfig as TitleConfig);
    }

    setDisplayType(mapPanelTypeToDisplayType(panelData));
    const panelConfig =
      (panelData.config as PanelEditorConfig | undefined) ?? {};
    setEditorConfig({
      ...panelConfig,
      color: panelConfig.color || DEFAULT_COLORS,
      legends: panelConfig.legends || DEFAULT_LEGENDS_CONFIG,
      formatting: panelConfig.formatting || DEFAULT_PANEL_FORMATTING_CONFIG,
    });
  }, [panelData]);

  useEffect(() => {
    if (!queryData || !remoteDatasetData) {
      return;
    }

    if (hydratedQueryRef.current === queryData.id) {
      return;
    }

    setSelectedDataset(remoteDatasetData);
    setDimensionItems(hydrateDimensions(queryData.dsl?.dimensions, remoteDatasetData));

    const nextMetrics = (
      (queryData.dsl?.metrics as Array<{ id: number }> | undefined) ?? []
    )
      .map((metric) =>
        remoteDatasetData.metrics.find((item) => item.id === metric.id),
      )
      .filter((metric): metric is NonNullable<typeof metric> => Boolean(metric))
      .map((metric) => ({ ...metric }) as DragItem);
    setDropMetrics(nextMetrics);

    const nextFilters = (
      (queryData.dsl?.filters as
        | Array<{ fieldId: number; op: string; value?: unknown }>
        | undefined) ?? []
    ).map((filter, index) => {
      const field = remoteDatasetData.fields.find(
        (item) => item.id === filter.fieldId,
      );
      return {
        id: `filter_${filter.fieldId}_${index}`,
        fieldId: filter.fieldId,
        name: field?.businessName || field?.name || `field_${filter.fieldId}`,
        fieldType: field?.type ?? FieldType.STRING,
        op: filter.op,
        value: filter.value,
      };
    });
    setDropFilters(nextFilters);

    const nextTempMetrics =
      (queryData.dsl?.tempMetrics as TempMetricConfig[] | undefined) ?? [];
    setTempMetrics(nextTempMetrics);

    hydratedQueryRef.current = queryData.id;
  }, [hydrateDimensions, queryData, remoteDatasetData]);

  const datasetData = selectedDataset ?? remoteDatasetData;

  const dropFields = useMemo<DragItem[]>(
    () => dimensionItems.map((dimension) => ({ ...dimension })),
    [dimensionItems],
  );

  const resetForDatasetChange = useCallback(() => {
    setDimensionItems([]);
    setDropMetrics([]);
    setDropFilters([]);
    setTempMetrics([]);
    setTempData(undefined);
  }, []);

  const selectDataset = useCallback((dataset: DatasetResponse) => {
    setSelectedDataset(dataset);
  }, []);

  const replaceDataset = useCallback(
    (dataset: DatasetResponse) => {
      resetForDatasetChange();
      setSelectedDataset(dataset);
    },
    [resetForDatasetChange],
  );

  const buildDsl = useCallback(
    (baseDsl?: QueryDsl): QueryDsl | undefined => {
      if (!datasetData?.id || !datasetData.mainTableId) {
        return undefined;
      }

      return {
        ...(baseDsl ?? {}),
        datasetId: datasetData.id,
        tableId: datasetData.mainTableId,
        // joins: datasetData.joins || [],
        dimensions: serializeDimensions(dimensionItems),
        metrics: dropMetrics.map((metric) => ({
          id: Number(metric.id),
          alias: metric.alias,
        })),
        filters: dropFilters.map((filter) => ({
          fieldId: filter.fieldId,
          op: filter.op,
          value: filter.value,
        })),
        tempMetrics: tempMetrics.length > 0 ? tempMetrics : undefined,
      };
    },
    [
      datasetData,
      dimensionItems,
      dropMetrics,
      dropFilters,
      serializeDimensions,
      tempMetrics,
    ],
  );

  const hasDataset = Boolean(datasetData);
  const hasQueryContent = Boolean(
    dimensionItems.length || dropMetrics.length || dropFilters.length || tempData,
  );
  const canRun =
    hasDataset && (dimensionItems.length > 0 || dropMetrics.length > 0);

  const runPreview = useCallback(
    async (dsl?: QueryDsl): Promise<ExecuteQueryResponse | undefined> => {
      const targetDsl =
        dsl ?? buildDsl((queryData?.dsl as QueryDsl | undefined) ?? undefined);
      if (!targetDsl) {
        return undefined;
      }

      const data = await executeTempQueryAsync(targetDsl);
      setTempData(data);
      return data;
    },
    [buildDsl, executeTempQueryAsync, queryData?.dsl],
  );

  const handleDropField = useCallback(
    (item: DragItem) => {
      if (!datasetData) {
        return;
      }

      const fieldId = Number(item.id);
      if (Number.isNaN(fieldId)) {
        return;
      }

      setDimensionItems((previous) => {
        if (
          previous.some(
            (entry) =>
              !entry.isDerived &&
              (entry.dimensionDsl as BaseDimensionDSL).fieldId === fieldId,
          )
        ) {
          return previous;
        }

        const field = datasetData.fields.find((entry) => entry.id === fieldId);
        if (!field) {
          return previous;
        }

        const nextItem = buildBaseDimensionItem(
          { fieldId: field.id, alias: undefined },
          datasetData.fields,
        );

        return [...previous, nextItem];
      });
    },
    [buildBaseDimensionItem, datasetData],
  );

  const handleRemoveField = useCallback((item: DragItem) => {
    setDimensionItems((previous) =>
      previous.filter((entry) => entry.id !== item.id),
    );
  }, []);

  const handleAddDerivedDimension = useCallback(
    (dimension: DerivedDimensionInput) => {
      if (!datasetData) {
        return;
      }

      setDimensionItems((previous) => [
        ...previous,
        buildDerivedDimensionItem(
          {
            ...dimension,
            alias: dimension.alias.trim(),
          },
          datasetData.fields,
        ),
      ]);
    },
    [buildDerivedDimensionItem, datasetData],
  );

  const handleUpdateDerivedDimension = useCallback(
    (dimensionItemId: string | number, dimension: DerivedDimensionInput) => {
      if (!datasetData) {
        return;
      }

      setDimensionItems((previous) =>
        previous.map((entry) => {
          if (entry.id !== dimensionItemId || !entry.isDerived) {
            return entry;
          }

          return buildDerivedDimensionItem(
            {
              ...dimension,
              alias: dimension.alias.trim(),
            },
            datasetData.fields,
            entry.id,
          );
        }),
      );
    },
    [buildDerivedDimensionItem, datasetData],
  );

  const handleDropMetric = useCallback(
    (item: DragItem) => {
      if (!datasetData) {
        return;
      }

      setDropMetrics((previous) => {
        if (previous.some((entry) => entry.id === item.id)) {
          return previous;
        }
        const metric = datasetData.metrics.find(
          (entry) => entry.id === item.id,
        );
        return metric ? [...previous, metric] : previous;
      });
    },
    [datasetData],
  );

  const handleRemoveMetric = useCallback((item: DragItem) => {
    setDropMetrics((previous) =>
      previous.filter((entry) => entry.id !== item.id),
    );
  }, []);

  const handleDropFilter = useCallback(
    (item: DragItem) => {
      if (!datasetData) {
        return;
      }

      const field = datasetData.fields.find((entry) => entry.id === item.id);
      if (!field) {
        return;
      }

      setDropFilters((previous) => {
        if (previous.some((filter) => filter.fieldId === item.id)) {
          return previous;
        }

        return [
          ...previous,
          {
            id: `filter_${item.id}_${Date.now()}`,
            fieldId: field.id,
            name: field.businessName || field.name,
            fieldType: field.type,
            op: "=",
          },
        ];
      });
    },
    [datasetData],
  );

  const handleRemoveFilter = useCallback((id: string | number) => {
    setDropFilters((previous) => previous.filter((filter) => filter.id !== id));
  }, []);

  const handleUpdateFilter = useCallback(
    (id: string | number, updates: Partial<FilterItem>) => {
      setDropFilters((previous) =>
        previous.map((filter) =>
          filter.id === id ? { ...filter, ...updates } : filter,
        ),
      );
    },
    [],
  );

  // 获取周期类型的中文标签
  const getPeriodTypeLabel = useCallback(
    (periodType: PeriodOverPeriodType): string => {
      const labels: Record<PeriodOverPeriodType, string> = {
        [PeriodOverPeriodType.DAY_OVER_DAY]: "日环比",
        [PeriodOverPeriodType.WEEK_OVER_WEEK]: "周环比",
        [PeriodOverPeriodType.MONTH_OVER_MONTH]: "月环比",
        [PeriodOverPeriodType.QUARTER_OVER_QUARTER]: "季环比",
        [PeriodOverPeriodType.YEAR_OVER_YEAR]: "年同比",
      };
      return labels[periodType] || "同环比";
    },
    [],
  );

  // 根据字段ID获取字段信息
  const getDatasetFieldById = useCallback(
    (fieldId: number) => {
      if (!datasetData) return undefined;
      return datasetData.fields.find((field) => field.id === fieldId);
    },
    [datasetData],
  );

  // 更新临时指标配置（同环比等）
  const handleUpdateTempMetric = useCallback(
    (metricId: string | number, config: PeriodOverPeriodConfig | undefined) => {
      // 获取原始指标信息（包含 timeFieldId）
      const fullMetric = datasetData?.metrics.find(
        (m) => m.id === Number(metricId),
      );

      setTempMetrics((previous) => {
        const existingIndex = previous.findIndex(
          (tm) => tm.baseMetricId === Number(metricId),
        );

        // 如果配置被清除，删除该临时指标
        if (!config?.periodType || !config?.calculationMode) {
          if (existingIndex >= 0) {
            return previous.filter((_, index) => index !== existingIndex);
          }
          return previous;
        }

        const metric = dropMetrics.find((m) => m.id === metricId);
        if (!metric) return previous;

        const periodTypeLabel = getPeriodTypeLabel(config.periodType);
        const calculationModeLabel =
          CALCULATION_MODE_LABELS[config.calculationMode];
        const baseName = metric.businessName || metric.name;

        const newTempMetric: TempMetricConfig = {
          id: `${metricId}_period_comparison`,
          type: "period_comparison",
          baseMetricId: Number(metricId),
          alias: `${baseName}_${periodTypeLabel}_${calculationModeLabel}`,
          businessName: `${baseName} (${periodTypeLabel}${calculationModeLabel})`,
          timeFieldId: fullMetric?.timeFieldId,
          periodType: config.periodType,
          calculationMode: config.calculationMode,
        };

        if (existingIndex >= 0) {
          // 更新现有配置
          return previous.map((tm, index) =>
            index === existingIndex ? newTempMetric : tm,
          );
        } else {
          // 添加新配置
          return [...previous, newTempMetric];
        }
      });

      // 根据指标的 timeFieldId 添加时间字段筛选
      if (fullMetric?.timeFieldId) {
        const timeField = getDatasetFieldById(fullMetric.timeFieldId);
        if (timeField) {
          setDropFilters((previous) => {
            const existingFilter = previous.find(
              (filter) => filter.fieldId === timeField.id,
            );
            if (existingFilter) {
              return previous;
            }
            const newFilter: FilterItem = {
              id: `time_filter_${Date.now()}`,
              fieldId: timeField.id,
              name: timeField.businessName || timeField.name,
              fieldType: timeField.type,
              op: "between",
              value: [],
            };
            return [...previous, newFilter];
          });
        }
      }
    },
    [datasetData, dropMetrics, getDatasetFieldById, getPeriodTypeLabel],
  );

  // 删除临时指标
  const handleRemoveTempMetric = useCallback((tempMetricId: string) => {
    setTempMetrics((previous) =>
      previous.filter((tm) => tm.id !== tempMetricId),
    );
  }, []);

  const handleEditorChange = useCallback(
    (type: DisplayPanelType, config: PanelEditorConfig) => {
      setDisplayType(type);
      setEditorConfig(config);
    },
    [],
  );

  const handleSaveItemFormatting = useCallback(
    (rule: PanelSimpleFormattingRule) => {
      setEditorConfig((previous) => {
        const nextFormatting = toSimpleFormattingConfig(previous.formatting);
        const nextRules = [...nextFormatting.rules];
        const targetIndex = nextRules.findIndex((currentRule) =>
          isSameFormattingTarget(
            currentRule.target,
            currentRule.role,
            rule.target,
            rule.role,
          ),
        );

        if (targetIndex >= 0) {
          nextRules[targetIndex] = rule;
        } else {
          nextRules.push(rule);
        }

        return {
          ...previous,
          formatting: {
            ...nextFormatting,
            rules: nextRules,
          },
        };
      });
    },
    [],
  );

  const handleRemoveItemFormatting = useCallback(
    (target: PanelFormattingTarget, role: PanelFormattingRole) => {
      setEditorConfig((previous) => {
        const nextFormatting = toSimpleFormattingConfig(previous.formatting);

        return {
          ...previous,
          formatting: {
            ...nextFormatting,
            rules: nextFormatting.rules.filter(
              (rule) => !isSameFormattingTarget(rule.target, rule.role, target, role),
            ),
          },
        };
      });
    },
    [],
  );

  const handleTitleChange = useCallback(
    (nextTitle: string, nextTitleConfig?: TitleConfig) => {
      setTitle(nextTitle);
      if (nextTitleConfig) {
        setTitleConfig(nextTitleConfig);
      }
    },
    [],
  );

  const handleRun = useCallback(() => {
    if (!canRun) {
      return;
    }

    const dsl = buildDsl((queryData?.dsl as QueryDsl | undefined) ?? undefined);
    if (!dsl) {
      return;
    }

    executeTempQuery(dsl, {
      onSuccess: (data) => {
        setTempData(data);
      },
    });
  }, [buildDsl, canRun, executeTempQuery, queryData?.dsl]);

  return {
    dimensionItems,
    dropFields,
    dropMetrics,
    dropFilters,
    tempMetrics,
    displayType,
    editorConfig,
    tempData,
    panelData,
    queryData,
    datasetData,
    selectedDataset,
    panelStatus,
    hasDataset,
    hasQueryContent,
    canRun,
    isPreviewRunning,
    selectDataset,
    replaceDataset,
    setPanelStatus,
    setTempData,
    buildDsl,
    resetForDatasetChange,
    runPreview,
    handleDropField,
    handleRemoveField,
    handleDropMetric,
    handleRemoveMetric,
    handleDropFilter,
    handleRemoveFilter,
    handleUpdateFilter,
    handleAddDerivedDimension,
    handleUpdateDerivedDimension,
    handleUpdateTempMetric,
    handleRemoveTempMetric,
    handleEditorChange,
    handleSaveItemFormatting,
    handleRemoveItemFormatting,
    handleRun,
    title,
    titleConfig,
    handleTitleChange,
  };
};
