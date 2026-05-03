import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  PeriodOverPeriodType,
  type DatasetResponse,
  type PanelQueryStatePayload,
  type QueryOrderByDSL,
} from "#pkg/seedar/types";
import type {
  DragItem,
  DerivedDimensionInput,
  DimensionItem,
  FilterItem,
  PeriodOverPeriodConfig,
  QueryDsl,
  SortItem,
  TempMetricConfig,
  TitleConfig,
} from "../types";
import { CALCULATION_MODE_LABELS } from "../types";
import type {
  DisplayPanelType,
  PanelEditorConfig,
} from "../components/panelEditor";
import type {
  PanelFormattingRole,
  PanelFormattingTarget,
  PanelSimpleFormattingRule,
  ExecuteQueryResponse,
} from "#pkg/seedar/types";
import {
  buildBaseDimensionItem,
  buildDerivedDimensionItem,
  isDerivedDimensionDsl,
  parseDimensionDsl,
  serializeDimensions,
} from "../utils/panelEditorState";
import {
  isSameFormattingTarget,
  toSimpleFormattingConfig,
} from "../utils/formatting";
import {
  buildSortCandidates,
  createSortItemFromCandidate,
  hydrateSortItems,
  syncSortItemsWithCandidates,
} from "../utils/querySort";

interface UsePanelEditorMutationsParams {
  datasetData?: DatasetResponse;
  dimensionItems: DimensionItem[];
  dropMetrics: DragItem[];
  dropFilters: FilterItem[];
  tempMetrics: TempMetricConfig[];
  sortItems: SortItem[];
  topN?: number;
  setSelectedDataset: Dispatch<SetStateAction<DatasetResponse | undefined>>;
  setDimensionItems: Dispatch<SetStateAction<DimensionItem[]>>;
  setDropMetrics: Dispatch<SetStateAction<DragItem[]>>;
  setDropFilters: Dispatch<SetStateAction<FilterItem[]>>;
  setTempMetrics: Dispatch<SetStateAction<TempMetricConfig[]>>;
  setSortItems: Dispatch<SetStateAction<SortItem[]>>;
  setTopN: Dispatch<SetStateAction<number | undefined>>;
  setTempData: Dispatch<SetStateAction<ExecuteQueryResponse | undefined>>;
  setDisplayType: Dispatch<SetStateAction<DisplayPanelType>>;
  setEditorConfig: Dispatch<SetStateAction<PanelEditorConfig>>;
  setTitle: Dispatch<SetStateAction<string>>;
  setTitleConfig: Dispatch<SetStateAction<TitleConfig | undefined>>;
  nextDerivedDimensionId: () => string | number;
}

interface UsePanelEditorMutationsReturn {
  resetForDatasetChange: () => void;
  selectDataset: (dataset: DatasetResponse) => void;
  replaceDataset: (dataset: DatasetResponse) => void;
  buildDsl: (baseDsl?: QueryDsl) => QueryDsl | undefined;
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
  handleAddSortItem: (orderBy: QueryOrderByDSL) => void;
  handleUpdateSortItem: (
    sortItemId: string,
    updates: Partial<SortItem>,
  ) => void;
  handleRemoveSortItem: (sortItemId: string) => void;
  handleUpdateTopN: (value?: number) => void;
  handleApplySortConfig: (nextSortItems: SortItem[], nextTopN?: number) => void;
  handleEditorChange: (
    type: DisplayPanelType,
    config: PanelEditorConfig,
  ) => void;
  handleSaveItemFormatting: (rule: PanelSimpleFormattingRule) => void;
  handleRemoveItemFormatting: (
    target: PanelFormattingTarget,
    role: PanelFormattingRole,
  ) => void;
  handleTitleChange: (title: string, titleConfig?: TitleConfig) => void;
  applyQueryState: (
    payload: PanelQueryStatePayload,
    targetDataset?: DatasetResponse,
  ) => void;
}

const asTrimmedString = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const next = value.trim();
  return next.length > 0 ? next : undefined;
};

export const usePanelEditorMutations = ({
  datasetData,
  dimensionItems,
  dropMetrics,
  dropFilters,
  tempMetrics,
  sortItems,
  topN,
  setSelectedDataset,
  setDimensionItems,
  setDropMetrics,
  setDropFilters,
  setTempMetrics,
  setSortItems,
  setTopN,
  setTempData,
  setDisplayType,
  setEditorConfig,
  setTitle,
  setTitleConfig,
  nextDerivedDimensionId,
}: UsePanelEditorMutationsParams): UsePanelEditorMutationsReturn => {
  const resetForDatasetChange = useCallback(() => {
    setDimensionItems([]);
    setDropMetrics([]);
    setDropFilters([]);
    setTempMetrics([]);
    setSortItems([]);
    setTopN(undefined);
    setTempData(undefined);
  }, [
    setDimensionItems,
    setDropFilters,
    setDropMetrics,
    setSortItems,
    setTempData,
    setTempMetrics,
    setTopN,
  ]);

  const selectDataset = useCallback(
    (dataset: DatasetResponse) => {
      setSelectedDataset(dataset);
    },
    [setSelectedDataset],
  );

  const replaceDataset = useCallback(
    (dataset: DatasetResponse) => {
      resetForDatasetChange();
      setSelectedDataset(dataset);
    },
    [resetForDatasetChange, setSelectedDataset],
  );

  const getSortCandidates = useCallback(
    (
      nextDimensions: DimensionItem[] = dimensionItems,
      nextMetrics: DragItem[] = dropMetrics,
      nextTempMetrics: TempMetricConfig[] = tempMetrics,
    ) =>
      buildSortCandidates({
        dimensions: nextDimensions,
        metrics: nextMetrics,
        tempMetrics: nextTempMetrics,
      }),
    [dimensionItems, dropMetrics, tempMetrics],
  );

  const buildDsl = useCallback(
    (baseDsl?: QueryDsl): QueryDsl | undefined => {
      if (!datasetData?.id) {
        return undefined;
      }

      const { tableId: _tableId, ...baseDslWithoutTableId } = baseDsl ?? {};

      return {
        ...baseDslWithoutTableId,
        datasetId: datasetData.id,
        dimensions: serializeDimensions(dimensionItems),
        metrics: dropMetrics.map((metric) => ({
          id: Number(metric.id),
          alias: typeof metric.alias === "string" ? metric.alias : undefined,
        })),
        filters: dropFilters.map((filter) => ({
          fieldId: filter.fieldId,
          op: filter.op,
          value: filter.value,
        })),
        tempMetrics: tempMetrics.length > 0 ? tempMetrics : undefined,
        orderBy:
          sortItems.length > 0
            ? sortItems.map((item) => ({
                ...item.orderBy,
                dir: item.dir,
              }))
            : undefined,
        topN: sortItems.length > 0 ? topN : undefined,
      };
    },
    [
      datasetData,
      dimensionItems,
      dropFilters,
      dropMetrics,
      sortItems,
      tempMetrics,
      topN,
    ],
  );

  const syncSortItemsState = useCallback(
    (
      nextDimensions: DimensionItem[] = dimensionItems,
      nextMetrics: DragItem[] = dropMetrics,
      nextTempMetrics: TempMetricConfig[] = tempMetrics,
    ) => {
      const candidates = getSortCandidates(
        nextDimensions,
        nextMetrics,
        nextTempMetrics,
      );
      setSortItems((previous) => {
        const nextSortItems = syncSortItemsWithCandidates(previous, candidates);
        if (nextSortItems.length === 0) {
          setTopN(undefined);
        }
        return nextSortItems;
      });
    },
    [
      dimensionItems,
      dropMetrics,
      getSortCandidates,
      setSortItems,
      setTopN,
      tempMetrics,
    ],
  );

  const handleAddSortItem = useCallback(
    (orderBy: QueryOrderByDSL) => {
      const candidates = getSortCandidates();
      const matchedCandidate = candidates.find((candidate) => {
        if (candidate.orderBy.tempMetricId && orderBy.tempMetricId) {
          return candidate.orderBy.tempMetricId === orderBy.tempMetricId;
        }
        if (
          candidate.orderBy.metricId !== undefined &&
          orderBy.metricId !== undefined
        ) {
          return candidate.orderBy.metricId === orderBy.metricId;
        }
        if (candidate.orderBy.alias && orderBy.alias) {
          return candidate.orderBy.alias === orderBy.alias;
        }
        if (
          candidate.orderBy.fieldId !== undefined &&
          orderBy.fieldId !== undefined
        ) {
          return candidate.orderBy.fieldId === orderBy.fieldId;
        }
        return false;
      });

      if (!matchedCandidate) {
        return;
      }

      const nextSortItem = createSortItemFromCandidate(matchedCandidate);
      setSortItems((previous) => {
        if (
          previous.some(
            (item) =>
              item.sourceType === nextSortItem.sourceType &&
              item.sourceId === nextSortItem.sourceId,
          )
        ) {
          return previous;
        }
        return [...previous, nextSortItem];
      });
    },
    [getSortCandidates, setSortItems],
  );

  const handleUpdateSortItem = useCallback(
    (sortItemId: string, updates: Partial<SortItem>) => {
      setSortItems((previous) =>
        previous.map((item) =>
          item.id === sortItemId
            ? {
                ...item,
                ...updates,
              }
            : item,
        ),
      );
    },
    [setSortItems],
  );

  const handleRemoveSortItem = useCallback(
    (sortItemId: string) => {
      setSortItems((previous) => {
        const nextSortItems = previous.filter((item) => item.id !== sortItemId);
        if (nextSortItems.length === 0) {
          setTopN(undefined);
        }
        return nextSortItems;
      });
    },
    [setSortItems, setTopN],
  );

  const handleUpdateTopN = useCallback(
    (value?: number) => {
      if (value === undefined || value === null || Number.isNaN(value)) {
        setTopN(undefined);
        return;
      }

      const normalized = Math.max(1, Math.floor(value));
      setTopN(normalized);
    },
    [setTopN],
  );

  const handleApplySortConfig = useCallback(
    (nextSortItems: SortItem[], nextTopN?: number) => {
      setSortItems(nextSortItems);
      if (nextSortItems.length === 0) {
        setTopN(undefined);
        return;
      }

      if (
        nextTopN === undefined ||
        nextTopN === null ||
        Number.isNaN(nextTopN)
      ) {
        setTopN(undefined);
        return;
      }

      setTopN(Math.max(1, Math.floor(nextTopN)));
    },
    [setSortItems, setTopN],
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
              (entry.dimensionDsl as { fieldId?: number }).fieldId === fieldId,
          )
        ) {
          return previous;
        }

        const field = datasetData.fields.find((entry) => entry.id === fieldId);
        if (!field) {
          return previous;
        }

        const nextItem = buildBaseDimensionItem({
          dimensionDsl: { fieldId: field.id, alias: undefined },
          datasetFields: datasetData.fields,
        });

        const nextDimensions = [...previous, nextItem];
        syncSortItemsState(nextDimensions, dropMetrics, tempMetrics);
        return nextDimensions;
      });
    },
    [datasetData, dropMetrics, setDimensionItems, syncSortItemsState, tempMetrics],
  );

  const handleRemoveField = useCallback(
    (item: DragItem) => {
      setDimensionItems((previous) => {
        const nextDimensions = previous.filter((entry) => entry.id !== item.id);
        syncSortItemsState(nextDimensions, dropMetrics, tempMetrics);
        return nextDimensions;
      });
    },
    [dropMetrics, setDimensionItems, syncSortItemsState, tempMetrics],
  );

  const handleAddDerivedDimension = useCallback(
    (dimension: DerivedDimensionInput) => {
      if (!datasetData) {
        return;
      }

      setDimensionItems((previous) => {
        const nextDimensions = [
          ...previous,
          buildDerivedDimensionItem({
            dimensionDsl: {
              ...dimension,
              alias: dimension.alias.trim(),
            },
            datasetFields: datasetData.fields,
            nextId: nextDerivedDimensionId,
          }),
        ];
        syncSortItemsState(nextDimensions, dropMetrics, tempMetrics);
        return nextDimensions;
      });
    },
    [
      datasetData,
      dropMetrics,
      nextDerivedDimensionId,
      setDimensionItems,
      syncSortItemsState,
      tempMetrics,
    ],
  );

  const handleUpdateDerivedDimension = useCallback(
    (dimensionItemId: string | number, dimension: DerivedDimensionInput) => {
      if (!datasetData) {
        return;
      }

      setDimensionItems((previous) => {
        const nextDimensions = previous.map((entry) => {
          if (entry.id !== dimensionItemId || !entry.isDerived) {
            return entry;
          }

          return buildDerivedDimensionItem({
            dimensionDsl: {
              ...dimension,
              alias: dimension.alias.trim(),
            },
            datasetFields: datasetData.fields,
            id: entry.id,
            nextId: nextDerivedDimensionId,
          });
        });
        syncSortItemsState(nextDimensions, dropMetrics, tempMetrics);
        return nextDimensions;
      });
    },
    [
      datasetData,
      dropMetrics,
      nextDerivedDimensionId,
      setDimensionItems,
      syncSortItemsState,
      tempMetrics,
    ],
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
        if (!metric) {
          return previous;
        }

        const nextMetrics = [...previous, metric];
        syncSortItemsState(dimensionItems, nextMetrics, tempMetrics);
        return nextMetrics;
      });
    },
    [
      datasetData,
      dimensionItems,
      setDropMetrics,
      syncSortItemsState,
      tempMetrics,
    ],
  );

  const handleRemoveMetric = useCallback(
    (item: DragItem) => {
      setDropMetrics((previous) => {
        const nextMetrics = previous.filter((entry) => entry.id !== item.id);
        syncSortItemsState(dimensionItems, nextMetrics, tempMetrics);
        return nextMetrics;
      });
    },
    [dimensionItems, setDropMetrics, syncSortItemsState, tempMetrics],
  );

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
    [datasetData, setDropFilters],
  );

  const handleRemoveFilter = useCallback(
    (id: string | number) => {
      setDropFilters((previous) =>
        previous.filter((filter) => filter.id !== id),
      );
    },
    [setDropFilters],
  );

  const handleUpdateFilter = useCallback(
    (id: string | number, updates: Partial<FilterItem>) => {
      setDropFilters((previous) =>
        previous.map((filter) =>
          filter.id === id ? { ...filter, ...updates } : filter,
        ),
      );
    },
    [setDropFilters],
  );

  const getPeriodTypeLabel = useCallback(
    (periodType: PeriodOverPeriodType): string => {
      const labels: Record<PeriodOverPeriodType, string> = {
        [PeriodOverPeriodType.DAY_OVER_DAY]: "日环比",
        [PeriodOverPeriodType.WEEK_OVER_WEEK]: "周环比",
        [PeriodOverPeriodType.MONTH_OVER_MONTH]: "月环比",
        [PeriodOverPeriodType.QUARTER_OVER_QUARTER]: "季环比",
        [PeriodOverPeriodType.YEAR_OVER_YEAR]: "年同比",
      };
      return labels[periodType] || "同比环比";
    },
    [],
  );

  const getDatasetFieldById = useCallback(
    (fieldId: number) => {
      if (!datasetData) {
        return undefined;
      }
      return datasetData.fields.find((field) => field.id === fieldId);
    },
    [datasetData],
  );

  const handleUpdateTempMetric = useCallback(
    (metricId: string | number, config: PeriodOverPeriodConfig | undefined) => {
      const fullMetric = datasetData?.metrics.find(
        (metric) => metric.id === Number(metricId),
      );

      setTempMetrics((previous) => {
        const existingIndex = previous.findIndex(
          (metric) => metric.baseMetricId === Number(metricId),
        );

        if (!config?.periodType || !config?.calculationMode) {
          if (existingIndex >= 0) {
            const nextTempMetrics = previous.filter(
              (_, index) => index !== existingIndex,
            );
            syncSortItemsState(dimensionItems, dropMetrics, nextTempMetrics);
            return nextTempMetrics;
          }
          return previous;
        }

        const metric = dropMetrics.find((entry) => entry.id === metricId);
        if (!metric) {
          return previous;
        }

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
          timeFieldId: config.timeFieldId ?? fullMetric?.timeFieldId,
          periodType: config.periodType,
          calculationMode: config.calculationMode,
        };

        if (existingIndex >= 0) {
          const nextTempMetrics = previous.map((metricItem, index) =>
            index === existingIndex ? newTempMetric : metricItem,
          );
          syncSortItemsState(dimensionItems, dropMetrics, nextTempMetrics);
          return nextTempMetrics;
        }

        const nextTempMetrics = [...previous, newTempMetric];
        syncSortItemsState(dimensionItems, dropMetrics, nextTempMetrics);
        return nextTempMetrics;
      });

      const effectiveTimeFieldId = config?.timeFieldId ?? fullMetric?.timeFieldId;
      if (effectiveTimeFieldId) {
        const timeField = getDatasetFieldById(effectiveTimeFieldId);
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
    [
      dimensionItems,
      datasetData,
      dropMetrics,
      getDatasetFieldById,
      getPeriodTypeLabel,
      setDropFilters,
      setTempMetrics,
      syncSortItemsState,
    ],
  );

  const handleRemoveTempMetric = useCallback(
    (tempMetricId: string) => {
      setTempMetrics((previous) => {
        const nextTempMetrics = previous.filter(
          (metric) => metric.id !== tempMetricId,
        );
        syncSortItemsState(dimensionItems, dropMetrics, nextTempMetrics);
        return nextTempMetrics;
      });
    },
    [dimensionItems, dropMetrics, setTempMetrics, syncSortItemsState],
  );

  const handleEditorChange = useCallback(
    (type: DisplayPanelType, config: PanelEditorConfig) => {
      setDisplayType(type);
      setEditorConfig(config);
    },
    [setDisplayType, setEditorConfig],
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
    [setEditorConfig],
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
              (rule) =>
                !isSameFormattingTarget(rule.target, rule.role, target, role),
            ),
          },
        };
      });
    },
    [setEditorConfig],
  );

  const handleTitleChange = useCallback(
    (nextTitle: string, nextTitleConfig?: TitleConfig) => {
      setTitle(nextTitle);
      if (nextTitleConfig) {
        setTitleConfig(nextTitleConfig);
      }
    },
    [setTitle, setTitleConfig],
  );

  const applyQueryState = useCallback(
    (payload: PanelQueryStatePayload, targetDataset?: DatasetResponse) => {
      const nextDataset = targetDataset ?? datasetData;
      if (!nextDataset?.id) {
        throw {
          code: "WORKFLOW_DATASET_NOT_FOUND",
          message: "当前查询态缺少可用数据集",
        };
      }

      const hasDatasetChanged = nextDataset.id !== datasetData?.id;
      const baseDimensionItems = hasDatasetChanged ? [] : dimensionItems;
      const baseDropMetrics = hasDatasetChanged ? [] : dropMetrics;
      const baseDropFilters = hasDatasetChanged ? [] : dropFilters;
      const baseTempMetrics = hasDatasetChanged ? [] : tempMetrics;
      const baseSortItems = hasDatasetChanged ? [] : sortItems;
      const baseTopN = hasDatasetChanged ? undefined : topN;

      const nextDimensionItems =
        payload.dimensions === undefined
          ? baseDimensionItems
          : payload.dimensions.map((dimension, index) => {
              const parsedDimension =
                dimension.dimensionDsl !== undefined
                  ? parseDimensionDsl(dimension.dimensionDsl)
                  : parseDimensionDsl({
                      fieldId: dimension.fieldId,
                    });

              if (!parsedDimension) {
                throw {
                  code: "WORKFLOW_QUERY_STATE_INVALID",
                  message: `第 ${index + 1} 个维度无法映射到当前 panel 状态`,
                };
              }

              if (isDerivedDimensionDsl(parsedDimension)) {
                return buildDerivedDimensionItem({
                  dimensionDsl: parsedDimension,
                  datasetFields: nextDataset.fields,
                  nextId: nextDerivedDimensionId,
                });
              }

              return buildBaseDimensionItem({
                dimensionDsl: parsedDimension,
                datasetFields: nextDataset.fields,
              });
            });

      const nextDropMetrics =
        payload.metrics === undefined
          ? baseDropMetrics
          : payload.metrics.map((metric, index) => {
              const matchedMetric = nextDataset.metrics.find(
                (entry) => entry.id === metric.id,
              );

              if (!matchedMetric) {
                throw {
                  code: "WORKFLOW_QUERY_STATE_INVALID",
                  message: `第 ${index + 1} 个指标在当前数据集中不存在`,
                };
              }

              return {
                ...matchedMetric,
                alias: asTrimmedString(metric.alias),
              };
            });

      const nextDropFilters =
        payload.filters === undefined
          ? baseDropFilters
          : payload.filters.map((filter, index) => {
              const matchedField = nextDataset.fields.find(
                (entry) => entry.id === filter.fieldId,
              );

              if (!matchedField) {
                throw {
                  code: "WORKFLOW_QUERY_STATE_INVALID",
                  message: `第 ${index + 1} 个筛选字段在当前数据集中不存在`,
                };
              }

              return {
                id: `workflow_filter_${filter.fieldId}_${index}`,
                fieldId: filter.fieldId,
                name:
                  matchedField.businessName ||
                  matchedField.name ||
                  `field_${filter.fieldId}`,
                fieldType: matchedField.type,
                op: filter.op,
                value: filter.value,
              };
            });

      const nextTempMetrics =
        payload.tempMetrics === undefined
          ? baseTempMetrics
          : payload.tempMetrics.map((tempMetric, index) => {
              const alias = asTrimmedString(tempMetric.alias);
              if (!alias) {
                throw {
                  code: "WORKFLOW_QUERY_STATE_INVALID",
                  message: `第 ${index + 1} 个临时指标缺少 alias`,
                };
              }

              if (typeof tempMetric.baseMetricId !== "number") {
                throw {
                  code: "WORKFLOW_QUERY_STATE_INVALID",
                  message: `第 ${index + 1} 个临时指标缺少 baseMetricId`,
                };
              }

              const matchedMetric = nextDataset.metrics.find(
                (entry) => entry.id === tempMetric.baseMetricId,
              );

              if (!matchedMetric) {
                throw {
                  code: "WORKFLOW_QUERY_STATE_INVALID",
                  message: `第 ${index + 1} 个临时指标依赖的基础指标不存在`,
                };
              }

              return {
                id:
                  asTrimmedString(tempMetric.id) ??
                  `${tempMetric.baseMetricId}_period_comparison_${index}`,
                type: "period_comparison" as const,
                alias,
                businessName:
                  asTrimmedString(tempMetric.businessName) ?? alias,
                baseMetricId: tempMetric.baseMetricId,
                timeFieldId:
                  typeof tempMetric.timeFieldId === "number"
                    ? tempMetric.timeFieldId
                    : matchedMetric.timeFieldId,
                periodType: tempMetric.periodType,
                calculationMode: tempMetric.calculationMode,
              };
            });

      const nextSortCandidates = buildSortCandidates({
        dimensions: nextDimensionItems,
        metrics: nextDropMetrics,
        tempMetrics: nextTempMetrics,
      });

      const nextSortItems =
        payload.orderBy === undefined
          ? syncSortItemsWithCandidates(baseSortItems, nextSortCandidates)
          : hydrateSortItems(payload.orderBy, nextSortCandidates);

      const nextTopN =
        nextSortItems.length === 0
          ? undefined
          : payload.topN === undefined
            ? baseTopN
            : payload.topN;

      setSelectedDataset(nextDataset);
      setDimensionItems(nextDimensionItems);
      setDropMetrics(nextDropMetrics);
      setDropFilters(nextDropFilters);
      setTempMetrics(nextTempMetrics);
      setSortItems(nextSortItems);
      setTopN(nextTopN);
      setTempData(undefined);
    },
    [
      datasetData,
      dimensionItems,
      dropFilters,
      dropMetrics,
      nextDerivedDimensionId,
      setDimensionItems,
      setDropFilters,
      setDropMetrics,
      setSelectedDataset,
      setSortItems,
      setTempData,
      setTempMetrics,
      setTopN,
      sortItems,
      tempMetrics,
      topN,
    ],
  );

  return {
    resetForDatasetChange,
    selectDataset,
    replaceDataset,
    buildDsl,
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
    handleAddSortItem,
    handleUpdateSortItem,
    handleRemoveSortItem,
    handleUpdateTopN,
    handleApplySortConfig,
    handleEditorChange,
    handleSaveItemFormatting,
    handleRemoveItemFormatting,
    handleTitleChange,
    applyQueryState,
  };
};
