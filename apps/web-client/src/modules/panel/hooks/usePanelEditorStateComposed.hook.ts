import {
  useDataset,
  useExecuteTempQuery,
  usePanel,
  useQuery,
} from "#pkg/seedar/ui-react";
import { PanelStatus } from "#pkg/seedar/types";
import { useCallback, useMemo, useRef, useState } from "react";
import type {
  DatasetResponse,
  ExecuteQueryResponse,
  PanelQueryStatePayload,
  PanelFormattingRole,
  PanelFormattingTarget,
  PanelResponse,
  PanelSimpleFormattingRule,
  QueryOrderByDSL,
  QueryResponse,
} from "#pkg/seedar/types";
import {
  DEFAULT_COLORS,
  DEFAULT_LEGENDS_CONFIG,
  DEFAULT_PANEL_FORMATTING_CONFIG,
  type DisplayPanelType,
  type PanelEditorConfig,
} from "../components/panelEditor";
import type {
  DragItem,
  DerivedDimensionInput,
  DimensionItem,
  FilterItem,
  LocalPanelStatus,
  PeriodOverPeriodConfig,
  QueryDsl,
  SortItem,
  TempMetricConfig,
  TitleConfig,
} from "../types";
import { usePanelEditorHydration } from "./usePanelEditorHydration.hook";
import { usePanelEditorMutations } from "./usePanelEditorMutations.hook";

// Canonical implementation of panel editor state orchestration.
export type { DerivedDimensionInput, DimensionItem, TempMetricConfig };

const cloneSnapshotValue = <T,>(value: T): T => {
  if (value === undefined) {
    return value;
  }

  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

export interface PanelEditorSnapshot {
  dimensionItems: DimensionItem[];
  dropMetrics: DragItem[];
  dropFilters: FilterItem[];
  tempMetrics: TempMetricConfig[];
  sortItems: SortItem[];
  topN?: number;
  displayType: DisplayPanelType;
  editorConfig: PanelEditorConfig;
  tempData?: ExecuteQueryResponse;
  selectedDataset?: DatasetResponse;
  panelStatus: LocalPanelStatus;
  title: string;
  titleConfig?: TitleConfig;
}

interface UsePanelEditorStateReturn {
  dimensionItems: DimensionItem[];
  dropFields: DragItem[];
  dropMetrics: DragItem[];
  dropFilters: FilterItem[];
  tempMetrics: TempMetricConfig[];
  sortItems: SortItem[];
  topN?: number;
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
  handleAddSortItem: (orderBy: QueryOrderByDSL) => void;
  handleUpdateSortItem: (
    sortItemId: string,
    updates: Partial<SortItem>,
  ) => void;
  handleRemoveSortItem: (sortItemId: string) => void;
  handleUpdateTopN: (value?: number) => void;
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
  applyQueryState: (
    payload: PanelQueryStatePayload,
    targetDataset?: DatasetResponse,
  ) => void;
  createSnapshot: () => PanelEditorSnapshot;
  restoreSnapshot: (snapshot: PanelEditorSnapshot) => void;
}

export const usePanelEditorState = (
  panelId?: string,
): UsePanelEditorStateReturn => {
  const [dimensionItems, setDimensionItems] = useState<DimensionItem[]>([]);
  const [dropMetrics, setDropMetrics] = useState<DragItem[]>([]);
  const [dropFilters, setDropFilters] = useState<FilterItem[]>([]);
  const [tempMetrics, setTempMetrics] = useState<TempMetricConfig[]>([]);
  const [sortItems, setSortItems] = useState<SortItem[]>([]);
  const [topN, setTopN] = useState<number | undefined>();
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
  const previewRequestIdRef = useRef(0);

  const { data: panelData } = usePanel(panelId ?? "", !!panelId);
  const queryId = panelData?.queryId;
  const { data: queryData } = useQuery(queryId ?? "");
  const { data: remoteDatasetData } = useDataset(queryData?.datasetId ?? 0);
  const {
    mutate: executeTempQuery,
    mutateAsync: executeTempQueryAsync,
    isPending: isPreviewRunning,
  } = useExecuteTempQuery();

  usePanelEditorHydration({
    panelId,
    panelData,
    queryData,
    remoteDatasetData,
    hydratedQueryRef,
    setPanelStatus,
    setTitle,
    setTitleConfig,
    setDisplayType,
    setEditorConfig,
    setSelectedDataset,
    setDimensionItems,
    setDropMetrics,
    setDropFilters,
    setTempMetrics,
    setSortItems,
    setTopN,
  });

  const datasetData = selectedDataset ?? remoteDatasetData;

  const nextDerivedDimensionId = useCallback(() => {
    derivedDimensionSeedRef.current += 1;
    return `derived_dimension_${derivedDimensionSeedRef.current}_${Date.now()}`;
  }, []);

  const {
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
    handleEditorChange,
    handleSaveItemFormatting,
    handleRemoveItemFormatting,
    handleTitleChange,
    applyQueryState,
  } = usePanelEditorMutations({
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
  });

  const dropFields = useMemo<DragItem[]>(
    () => dimensionItems.map((dimension) => ({ ...dimension })),
    [dimensionItems],
  );

  const hasDataset = Boolean(datasetData);
  const hasQueryContent = Boolean(
    dimensionItems.length ||
      dropMetrics.length ||
      dropFilters.length ||
      sortItems.length ||
      topN !== undefined ||
      tempData,
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

      const requestId = previewRequestIdRef.current + 1;
      previewRequestIdRef.current = requestId;
      const data = await executeTempQueryAsync(targetDsl);
      if (previewRequestIdRef.current === requestId) {
        setTempData(data);
      }
      return data;
    },
    [buildDsl, executeTempQueryAsync, queryData?.dsl],
  );

  const handleRun = useCallback(() => {
    if (!canRun) {
      return;
    }

    const dsl = buildDsl((queryData?.dsl as QueryDsl | undefined) ?? undefined);
    if (!dsl) {
      return;
    }

    const requestId = previewRequestIdRef.current + 1;
    previewRequestIdRef.current = requestId;
    executeTempQuery(dsl, {
      onSuccess: (data) => {
        if (previewRequestIdRef.current === requestId) {
          setTempData(data);
        }
      },
    });
  }, [buildDsl, canRun, executeTempQuery, queryData?.dsl]);

  const createSnapshot = useCallback(
    (): PanelEditorSnapshot => ({
      dimensionItems: cloneSnapshotValue(dimensionItems),
      dropMetrics: cloneSnapshotValue(dropMetrics),
      dropFilters: cloneSnapshotValue(dropFilters),
      tempMetrics: cloneSnapshotValue(tempMetrics),
      sortItems: cloneSnapshotValue(sortItems),
      topN,
      displayType,
      editorConfig: cloneSnapshotValue(editorConfig),
      tempData: cloneSnapshotValue(tempData),
      selectedDataset: cloneSnapshotValue(selectedDataset),
      panelStatus,
      title,
      titleConfig: cloneSnapshotValue(titleConfig),
    }),
    [
      dimensionItems,
      dropFilters,
      dropMetrics,
      displayType,
      editorConfig,
      panelStatus,
      selectedDataset,
      tempData,
      tempMetrics,
      sortItems,
      topN,
      title,
      titleConfig,
    ],
  );

  const restoreSnapshot = useCallback((snapshot: PanelEditorSnapshot) => {
    setDimensionItems(cloneSnapshotValue(snapshot.dimensionItems));
    setDropMetrics(cloneSnapshotValue(snapshot.dropMetrics));
    setDropFilters(cloneSnapshotValue(snapshot.dropFilters));
    setTempMetrics(cloneSnapshotValue(snapshot.tempMetrics));
    setSortItems(cloneSnapshotValue(snapshot.sortItems));
    setTopN(snapshot.topN);
    setDisplayType(snapshot.displayType);
    setEditorConfig(cloneSnapshotValue(snapshot.editorConfig));
    setTempData(cloneSnapshotValue(snapshot.tempData));
    setSelectedDataset(cloneSnapshotValue(snapshot.selectedDataset));
    setPanelStatus(snapshot.panelStatus);
    setTitle(snapshot.title);
    setTitleConfig(cloneSnapshotValue(snapshot.titleConfig));
  }, []);

  return {
    dimensionItems,
    dropFields,
    dropMetrics,
    dropFilters,
    tempMetrics,
    sortItems,
    topN,
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
    handleAddSortItem,
    handleUpdateSortItem,
    handleRemoveSortItem,
    handleUpdateTopN,
    handleEditorChange,
    handleSaveItemFormatting,
    handleRemoveItemFormatting,
    handleRun,
    title,
    titleConfig,
    handleTitleChange,
    applyQueryState,
    createSnapshot,
    restoreSnapshot,
  };
};
