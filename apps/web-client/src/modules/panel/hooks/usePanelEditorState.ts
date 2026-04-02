import {
  useDataset,
  useExecuteTempQuery,
  useQuery,
  usePanel,
} from "#pkg/seedar/ui-react";
import {
  ExecuteQueryResponse,
  PanelResponse,
  DatasetResponse,
} from "#pkg/seedar/types";
import { DragItem } from "../components/dndHelper/dragZone/dragZone";
import {
  DisplayPanelType,
  PanelEditorConfig,
  DEFAULT_COLORS,
  DEFAULT_LEGENDS_CONFIG,
} from "../components/panelEditor";
import { FilterItem } from "../components/queryZone/types";
import { useCallback, useEffect, useState } from "react";
import type { TitleConfig } from "../components/editableTitle";

interface UsePanelEditorStateReturn {
  dropFields: DragItem[];
  dropMetrics: DragItem[];
  dropFilters: FilterItem[];
  displayType: DisplayPanelType;
  editorConfig: PanelEditorConfig;
  tempData: ExecuteQueryResponse | undefined;
  panelData: PanelResponse | undefined;
  queryData: any;
  datasetData: DatasetResponse | undefined;
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
  handleEditorChange: (
    type: DisplayPanelType,
    config: PanelEditorConfig,
  ) => void;
  handleRun: () => void;
  title: string;
  titleConfig?: TitleConfig;
  handleTitleChange: (title: string, titleConfig?: TitleConfig) => void;
}

export const usePanelEditorState = (
  panelId?: string,
): UsePanelEditorStateReturn => {
  const [dropFields, setDropFields] = useState<DragItem[]>([]);
  const [dropMetrics, setDropMetrics] = useState<DragItem[]>([]);
  const [dropFilters, setDropFilters] = useState<FilterItem[]>([]);
  const [displayType, setDisplayType] = useState<DisplayPanelType>("table");
  const [editorConfig, setEditorConfig] = useState<PanelEditorConfig>({
    color: DEFAULT_COLORS,
    legends: DEFAULT_LEGENDS_CONFIG,
  });
  const [tempData, setTempData] = useState<ExecuteQueryResponse>();
  const [title, setTitle] = useState<string>("未命名面板");
  const [titleConfig, setTitleConfig] = useState<TitleConfig | undefined>();

  const { data: panelData } = usePanel(panelId!);
  const { data: queryData } = useQuery((panelData as PanelResponse)?.queryId!);
  const { data: datasetData } = useDataset(queryData?.datasetId!);
  const { mutate: executeTempQuery } = useExecuteTempQuery();

  useEffect(() => {
    if (!queryData || !datasetData) return;
    setDropFields(
      (queryData?.dsl?.dimensions as number[]).map((id) => {
        return datasetData?.fields?.find((f) => f.id === id) || { id };
      }),
    );
    setDropMetrics(
      (queryData?.dsl?.metrics as { id: number }[]).map((metric) => {
        return (
          datasetData?.metrics?.find((m) => m.id === metric.id) || {
            id: metric.id,
          }
        );
      }),
    );
    setDropFilters(
      (queryData?.dsl?.filters || []).map(
        (filter: { fieldId: number; op: string; value?: any }) => {
          const field = datasetData?.fields?.find(
            (f) => f.id === filter.fieldId,
          );
          return {
            id: `filter_${filter.fieldId}_${Date.now()}`,
            fieldId: filter.fieldId,
            name: field?.businessName || field?.name || `字段${filter.fieldId}`,
            fieldType: field?.type,
            op: filter.op,
            value: filter.value,
          };
        },
      ),
    );
  }, [queryData, datasetData]);

  useEffect(() => {
    if (!panelData) return;
    const type = panelData.type as string;
    const config = (panelData.config as PanelEditorConfig) || {};

    if (type === "table" || type === "card") {
      setDisplayType(type);
    } else if (type === "chart" && config.type) {
      setDisplayType(config.type as DisplayPanelType);
    }
    setEditorConfig({
      ...config,
      color: config.color || DEFAULT_COLORS,
      legends: config.legends || DEFAULT_LEGENDS_CONFIG,
    });
  }, [panelData]);

  useEffect(() => {
    if (panelData?.title) {
      setTitle(panelData.title);
    }
    if (panelData?.titleConfig) {
      setTitleConfig(panelData.titleConfig as TitleConfig);
    }
  }, [panelData]);

  const handleDropField = useCallback(
    (item: DragItem) => {
      if (!datasetData) return;
      setDropFields((prev) => {
        if (prev.some((i) => i.id === item.id)) return prev;
        const field = datasetData.fields?.find((f) => f.id === item.id);
        return field ? [...prev, field] : prev;
      });
    },
    [datasetData],
  );

  const handleRemoveField = useCallback((item: DragItem) => {
    setDropFields((prev) => prev.filter((i) => i.id !== item.id));
  }, []);

  const handleDropMetric = useCallback(
    (item: DragItem) => {
      if (!datasetData) return;
      setDropMetrics((prev) => {
        if (prev.some((i) => i.id === item.id)) return prev;
        const metric = datasetData.metrics?.find((m) => m.id === item.id);
        return metric ? [...prev, metric] : prev;
      });
    },
    [datasetData],
  );

  const handleRemoveMetric = useCallback((item: DragItem) => {
    setDropMetrics((prev) => prev.filter((i) => i.id !== item.id));
  }, []);

  const handleDropFilter = useCallback(
    (item: DragItem) => {
      if (!datasetData) return;
      const field = datasetData.fields?.find((f) => f.id === item.id);
      if (!field) return;
      setDropFilters((prev) => {
        if (prev.some((f) => f.fieldId === item.id)) return prev;
        return [
          ...prev,
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
    setDropFilters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleUpdateFilter = useCallback(
    (id: string | number, updates: Partial<FilterItem>) => {
      setDropFilters((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      );
    },
    [],
  );

  const handleEditorChange = useCallback(
    (type: DisplayPanelType, config: PanelEditorConfig) => {
      setDisplayType(type);
      setEditorConfig(config);
    },
    [],
  );

  const handleTitleChange = useCallback((newTitle: string, newTitleConfig?: TitleConfig) => {
    setTitle(newTitle);
    if (newTitleConfig) {
      setTitleConfig(newTitleConfig);
    }
  }, []);

  const handleRun = useCallback(() => {
    if (!queryData) return;
    if (!dropFields.length && !dropMetrics.length) {
      return;
    }
    executeTempQuery(
      {
        datasetId: datasetData?.id!,
        tableId: datasetData?.mainTableId!,
        joins: datasetData?.joins || [],
        ...queryData?.dsl,
        dimensions: dropFields.map((f) => f.id),
        metrics: dropMetrics,
        filters: dropFilters.map((f) => ({
          fieldId: f.fieldId,
          op: f.op,
          value: f.value,
        })),
      },
      {
        onSuccess: (data) => {
          setTempData(data);
        },
      },
    );
  }, [
    dropFields,
    dropMetrics,
    dropFilters,
    executeTempQuery,
    queryData,
    datasetData,
  ]);

  return {
    dropFields,
    dropMetrics,
    dropFilters,
    displayType,
    editorConfig,
    tempData,
    panelData,
    queryData,
    datasetData,
    handleDropField,
    handleRemoveField,
    handleDropMetric,
    handleRemoveMetric,
    handleDropFilter,
    handleRemoveFilter,
    handleUpdateFilter,
    handleEditorChange,
    handleRun,
    title,
    titleConfig,
    handleTitleChange,
  };
};
