import {
  useDataset,
  useExecuteTempQuery,
  usePanel,
  useQuery,
} from "#pkg/seedar/ui-react";
import {
  FieldType,
  PanelStatus,
  QueryDSL,
  PeriodOverPeriodType,
  PeriodCalculationMode,
  type DatasetResponse,
  type ExecuteQueryResponse,
  type PanelResponse,
  type QueryResponse,
} from "#pkg/seedar/types";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TitleConfig } from "../components/editableTitle";
import type { DragItem } from "../components/dndHelper/dragZone/dragZone";
import {
  DEFAULT_COLORS,
  DEFAULT_LEGENDS_CONFIG,
  type DisplayPanelType,
  type PanelEditorConfig,
} from "../components/panelEditor";
import type { FilterItem } from "../components/queryZone/types";
import type { PeriodOverPeriodConfig } from "../components/queryZone/queryZone";

type LocalPanelStatus = "unsaved" | PanelStatus.DRAFT | PanelStatus.PUBLISHED;
type QueryDsl = QueryDSL;

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
  handleUpdateTempMetric: (
    metricId: string | number,
    config: PeriodOverPeriodConfig | undefined,
  ) => void;
  handleRemoveTempMetric: (tempMetricId: string) => void;
  handleEditorChange: (
    type: DisplayPanelType,
    config: PanelEditorConfig,
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

export const usePanelEditorState = (
  panelId?: string,
): UsePanelEditorStateReturn => {
  const [dropFields, setDropFields] = useState<DragItem[]>([]);
  const [dropMetrics, setDropMetrics] = useState<DragItem[]>([]);
  const [dropFilters, setDropFilters] = useState<FilterItem[]>([]);
  const [tempMetrics, setTempMetrics] = useState<TempMetricConfig[]>([]);
  const [displayType, setDisplayType] = useState<DisplayPanelType>("table");
  const [editorConfig, setEditorConfig] = useState<PanelEditorConfig>({
    color: DEFAULT_COLORS,
    legends: DEFAULT_LEGENDS_CONFIG,
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

  const { data: panelData } = usePanel(panelId ?? "", !!panelId);
  const queryId = panelData?.queryId;
  const { data: queryData } = useQuery(queryId ?? "");
  const { data: remoteDatasetData } = useDataset(queryData?.datasetId ?? 0);
  const {
    mutate: executeTempQuery,
    mutateAsync: executeTempQueryAsync,
    isPending: isPreviewRunning,
  } = useExecuteTempQuery();

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
    const nextFields = (
      (queryData.dsl?.dimensions as number[] | undefined) ?? []
    )
      .map((id) => remoteDatasetData.fields.find((field) => field.id === id))
      .filter((field): field is NonNullable<typeof field> => Boolean(field))
      .map((field) => ({ ...field }) as DragItem);
    setDropFields(nextFields);

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
  }, [queryData, remoteDatasetData]);

  const datasetData = selectedDataset ?? remoteDatasetData;

  const resetForDatasetChange = useCallback(() => {
    setDropFields([]);
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
        dimensions: dropFields.map((field) => Number(field.field.id)),
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
    [datasetData, dropFields, dropMetrics, dropFilters, tempMetrics],
  );

  const hasDataset = Boolean(datasetData);
  const hasQueryContent = Boolean(
    dropFields.length || dropMetrics.length || dropFilters.length || tempData,
  );
  const canRun =
    hasDataset && (dropFields.length > 0 || dropMetrics.length > 0);

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

      setDropFields((previous) => {
        if (previous.some((entry) => entry.id === item.id)) {
          return previous;
        }
        const field = datasetData.fields.find((entry) => entry.id === item.id);
        return field ? [...previous, field] : previous;
      });
    },
    [datasetData],
  );

  const handleRemoveField = useCallback((item: DragItem) => {
    setDropFields((previous) =>
      previous.filter((entry) => entry.id !== item.id),
    );
  }, []);

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
  const getFieldById = useCallback(
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
        const timeField = getFieldById(fullMetric.timeFieldId);
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
    [dropMetrics, getPeriodTypeLabel, datasetData, getFieldById],
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
    handleUpdateTempMetric,
    handleRemoveTempMetric,
    handleEditorChange,
    handleRun,
    title,
    titleConfig,
    handleTitleChange,
  };
};
