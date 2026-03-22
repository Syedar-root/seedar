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
import { useCallback, useEffect, useState } from "react";

interface UsePanelEditorStateReturn {
  dropFields: DragItem[];
  dropMetrics: DragItem[];
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
  handleEditorChange: (type: DisplayPanelType, config: PanelEditorConfig) => void;
  handleRun: () => void;
  title: string;
  handleTitleChange: (title: string) => void;
}

export const usePanelEditorState = (
  panelId?: string,
): UsePanelEditorStateReturn => {
  const [dropFields, setDropFields] = useState<DragItem[]>([]);
  const [dropMetrics, setDropMetrics] = useState<DragItem[]>([]);
  const [displayType, setDisplayType] = useState<DisplayPanelType>("table");
  const [editorConfig, setEditorConfig] = useState<PanelEditorConfig>({
    color: DEFAULT_COLORS,
    legends: DEFAULT_LEGENDS_CONFIG,
  });
  const [tempData, setTempData] = useState<ExecuteQueryResponse>();
  const [title, setTitle] = useState<string>("未命名面板");

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

  const handleEditorChange = useCallback(
    (type: DisplayPanelType, config: PanelEditorConfig) => {
      setDisplayType(type);
      setEditorConfig(config);
    },
    [],
  );

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
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
      },
      {
        onSuccess: (data) => {
          setTempData(data);
        },
      },
    );
  }, [dropFields, dropMetrics, executeTempQuery, queryData, datasetData]);

  return {
    dropFields,
    dropMetrics,
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
    handleEditorChange,
    handleRun,
    title,
    handleTitleChange,
  };
};
