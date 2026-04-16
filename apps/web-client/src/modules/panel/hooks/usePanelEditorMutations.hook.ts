import { useCallback, type Dispatch, type SetStateAction } from "react";
import { PeriodOverPeriodType, type DatasetResponse } from "#pkg/seedar/types";
import type {
  DragItem,
  DerivedDimensionInput,
  DimensionItem,
  FilterItem,
  PeriodOverPeriodConfig,
  QueryDsl,
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
  serializeDimensions,
} from "../utils/panelEditorState";
import {
  isSameFormattingTarget,
  toSimpleFormattingConfig,
} from "../utils/formatting";

interface UsePanelEditorMutationsParams {
  datasetData?: DatasetResponse;
  dimensionItems: DimensionItem[];
  dropMetrics: DragItem[];
  dropFilters: FilterItem[];
  tempMetrics: TempMetricConfig[];
  setSelectedDataset: Dispatch<SetStateAction<DatasetResponse | undefined>>;
  setDimensionItems: Dispatch<SetStateAction<DimensionItem[]>>;
  setDropMetrics: Dispatch<SetStateAction<DragItem[]>>;
  setDropFilters: Dispatch<SetStateAction<FilterItem[]>>;
  setTempMetrics: Dispatch<SetStateAction<TempMetricConfig[]>>;
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
}

export const usePanelEditorMutations = ({
  datasetData,
  dimensionItems,
  dropMetrics,
  dropFilters,
  tempMetrics,
  setSelectedDataset,
  setDimensionItems,
  setDropMetrics,
  setDropFilters,
  setTempMetrics,
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
    setTempData(undefined);
  }, [
    setDimensionItems,
    setDropFilters,
    setDropMetrics,
    setTempData,
    setTempMetrics,
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

  const buildDsl = useCallback(
    (baseDsl?: QueryDsl): QueryDsl | undefined => {
      if (!datasetData?.id || !datasetData.mainTableId) {
        return undefined;
      }

      return {
        ...(baseDsl ?? {}),
        datasetId: datasetData.id,
        tableId: datasetData.mainTableId,
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
      };
    },
    [datasetData, dimensionItems, dropFilters, dropMetrics, tempMetrics],
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

        return [...previous, nextItem];
      });
    },
    [datasetData, setDimensionItems],
  );

  const handleRemoveField = useCallback(
    (item: DragItem) => {
      setDimensionItems((previous) =>
        previous.filter((entry) => entry.id !== item.id),
      );
    },
    [setDimensionItems],
  );

  const handleAddDerivedDimension = useCallback(
    (dimension: DerivedDimensionInput) => {
      if (!datasetData) {
        return;
      }

      setDimensionItems((previous) => [
        ...previous,
        buildDerivedDimensionItem({
          dimensionDsl: {
            ...dimension,
            alias: dimension.alias.trim(),
          },
          datasetFields: datasetData.fields,
          nextId: nextDerivedDimensionId,
        }),
      ]);
    },
    [datasetData, nextDerivedDimensionId, setDimensionItems],
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

          return buildDerivedDimensionItem({
            dimensionDsl: {
              ...dimension,
              alias: dimension.alias.trim(),
            },
            datasetFields: datasetData.fields,
            id: entry.id,
            nextId: nextDerivedDimensionId,
          });
        }),
      );
    },
    [datasetData, nextDerivedDimensionId, setDimensionItems],
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
    [datasetData, setDropMetrics],
  );

  const handleRemoveMetric = useCallback(
    (item: DragItem) => {
      setDropMetrics((previous) =>
        previous.filter((entry) => entry.id !== item.id),
      );
    },
    [setDropMetrics],
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
            return previous.filter((_, index) => index !== existingIndex);
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
          timeFieldId: fullMetric?.timeFieldId,
          periodType: config.periodType,
          calculationMode: config.calculationMode,
        };

        if (existingIndex >= 0) {
          return previous.map((metricItem, index) =>
            index === existingIndex ? newTempMetric : metricItem,
          );
        }

        return [...previous, newTempMetric];
      });

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
    [
      datasetData,
      dropMetrics,
      getDatasetFieldById,
      getPeriodTypeLabel,
      setDropFilters,
      setTempMetrics,
    ],
  );

  const handleRemoveTempMetric = useCallback(
    (tempMetricId: string) => {
      setTempMetrics((previous) =>
        previous.filter((metric) => metric.id !== tempMetricId),
      );
    },
    [setTempMetrics],
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
    handleEditorChange,
    handleSaveItemFormatting,
    handleRemoveItemFormatting,
    handleTitleChange,
  };
};
