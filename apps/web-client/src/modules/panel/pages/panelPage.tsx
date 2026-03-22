import {
  SeedarPanel,
  useDataset,
  useExecuteTempQuery,
  useQuery,
  useUpdateQuery,
  useUpdatePanel,
  useCreateQuery,
  useCreatePanel,
} from "#pkg/seedar/ui-react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./styles/panel.module.scss";
import { usePanel } from "#pkg/seedar/ui-react";
import {
  ExecuteQueryResponse,
  PanelResponse,
  PanelType,
} from "#pkg/seedar/types";
import { Aside } from "../components/aside";
import { QueryZone } from "../components/queryZone";
import {
  PanelEditor,
  DisplayPanelType,
  PanelEditorConfig,
  DEFAULT_COLORS,
  DEFAULT_LEGENDS_CONFIG,
  ChartType,
  CHART_FIELD_CONFIGS,
} from "../components/panelEditor";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DragItem } from "../components/dndHelper/dragZone/dragZone";
import { toast } from "sonner";

export const PanelPage = () => {
  const { panelId } = useParams();
  if (!panelId) {
    return null;
  }

  const [dropFields, setDropFields] = useState<DragItem[]>([]);
  const [dropMetrics, setDropMetrics] = useState<DragItem[]>([]);
  const [displayType, setDisplayType] = useState<DisplayPanelType>("table");
  const [editorConfig, setEditorConfig] = useState<PanelEditorConfig>({
    color: DEFAULT_COLORS,
    legends: DEFAULT_LEGENDS_CONFIG,
  });

  const { data: panelData } = usePanel(panelId);
  const { data: queryData } = useQuery((panelData as PanelResponse)?.queryId!);
  const { data: datasetData } = useDataset(queryData?.datasetId!);

  useEffect(() => {
    if (!queryData) return;
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

  const { mutate: executeTempQuery } = useExecuteTempQuery();
  const { mutate: updateQuery } = useUpdateQuery();
  const { mutate: updatePanel } = useUpdatePanel();
  const { mutate: createQuery } = useCreateQuery();
  const { mutate: createPanel } = useCreatePanel();
  const [tempData, setTempData] = useState<ExecuteQueryResponse>();
  const navigate = useNavigate();

  const handleRun = useCallback(() => {
    if (!queryData) return;
    if (!dropFields.length && !dropMetrics.length) {
      toast.error("请添加维度或指标");
      return;
    }
    executeTempQuery(
      {
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
  }, [dropFields, dropMetrics, executeTempQuery, queryData]);

  const handleSave = useCallback(() => {
    if (!panelData || !panelId) return;

    const panelType =
      displayType === "table" || displayType === "card" ? displayType : "chart";

    const config =
      displayType === "table" || displayType === "card"
        ? {}
        : { ...editorConfig, type: displayType };

    updatePanel(
      {
        id: panelId,
        data: {
          type: panelType as any,
          config,
        },
      },
      {
        onSuccess: () => {
          updateQuery(
            {
              id: panelData?.queryId!,
              data: {
                dsl: {
                  ...queryData?.dsl,
                  dimensions: dropFields.map((f) => f.id),
                  metrics: dropMetrics,
                },
              },
            },
            {
              onSuccess: () => {
                handleRun();
                toast.success("保存成功");
              },
            },
          );
        },
      },
    );
  }, [
    dropFields,
    dropMetrics,
    panelData,
    updateQuery,
    updatePanel,
    displayType,
    editorConfig,
    panelId,
    queryData?.dsl,
    handleRun,
  ]);

  const handleSaveAs = useCallback(() => {
    if (!panelData || !panelId) return;
    createQuery(
      {
        name: "未命名查询",
        datasetId: datasetData?.id!,
        dsl: {
          ...queryData?.dsl,
          dimensions: dropFields.map((f) => f.id),
          metrics: dropMetrics,
        },
      },
      {
        onSuccess: (data) => {
          const panelType =
            displayType === "table" || displayType === "card"
              ? displayType
              : "chart";
          createPanel(
            {
              title: "未命名面板",
              queryId: data.id,
              type: panelType as PanelType,
              config: {
                ...editorConfig,
                type: displayType,
              },
            },
            {
              onSuccess: (data) => {
                navigate(`/panel/${data.id}`);
                toast.success("另存为成功");
              },
            },
          );
        },
      },
    );
  }, [
    panelData,
    panelId,
    datasetData,
    dropFields,
    dropMetrics,
    displayType,
    editorConfig,
    createQuery,
    createPanel,
    queryData?.dsl,
    navigate,
  ]);

  const handleEditorChange = useCallback(
    (type: DisplayPanelType, config: PanelEditorConfig) => {
      setDisplayType(type);
      setEditorConfig(config);
    },
    [],
  );

  const previewSpec = useMemo(() => {
    if (displayType === "table" || displayType === "card") return undefined;

    const baseSpec: any = {
      type: displayType,
    };

    if (editorConfig.color?.length) {
      baseSpec.color = editorConfig.color;
    }

    if (editorConfig.label?.visible) {
      baseSpec.label = { visible: true };
    }

    if (editorConfig.legends?.visible) {
      baseSpec.legends = {
        visible: true,
        orient: editorConfig.legends.orient,
        layout: editorConfig.legends.layout,
        ...(editorConfig.legends.title && {
          title: { visible: true, text: editorConfig.legends.title },
        }),
      };
    }

    const fieldConfig = CHART_FIELD_CONFIGS[displayType as ChartType];
    if (fieldConfig) {
      const allFields = [...fieldConfig.required, ...fieldConfig.optional];
      allFields.forEach((field) => {
        const value = editorConfig[field as keyof PanelEditorConfig];
        if (value !== undefined) {
          baseSpec[field] = value;
        }
      });
    }

    return baseSpec;
  }, [displayType, editorConfig]);

  console.log("previewSpec", previewSpec);

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <Aside
          fields={datasetData?.fields || []}
          metrics={datasetData?.metrics || []}
        />
      </aside>
      <aside className={styles.editor}>
        <PanelEditor
          fields={dropFields}
          metrics={dropMetrics}
          config={editorConfig}
          displayType={displayType}
          onChange={handleEditorChange}
        />
      </aside>
      <main className={styles.main}>
        <header className={styles.mainHeader}>
          <QueryZone
            onDropField={handleDropField}
            onDropMetric={handleDropMetric}
            onRemoveField={handleRemoveField}
            onRemoveMetric={handleRemoveMetric}
            dropFields={dropFields}
            dropMetrics={dropMetrics}
          />
        </header>
        <div className={styles.operations}>
          <button className={styles.save} onClick={handleSave}>
            保存
          </button>
          <button className={styles.saveAs} onClick={handleSaveAs}>
            另存为
          </button>
          <button className={styles.run} onClick={handleRun}>
            运行
          </button>
        </div>
        <main className={styles.mainContent}>
          <SeedarPanel
            showHeader={false}
            panelId={panelId}
            data={tempData}
            panel={
              panelData
                ? ({
                    ...panelData,
                    type:
                      displayType === "table" || displayType === "card"
                        ? displayType
                        : "chart",
                    config: previewSpec,
                  } as any)
                : undefined
            }
          />
        </main>
      </main>
    </div>
  );
};
