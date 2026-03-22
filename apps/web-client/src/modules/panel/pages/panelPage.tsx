import {
  SeedarPanel,
  useDataset,
  useExecuteTempQuery,
  useQuery,
  useUpdateQuery,
  useUpdatePanel,
} from "#pkg/seedar/ui-react";
import { useParams } from "react-router-dom";
import styles from "./styles/panel.module.scss";
import { usePanel } from "#pkg/seedar/ui-react";
import { ExecuteQueryResponse, PanelResponse } from "#pkg/seedar/types";
import { Aside } from "../components/aside";
import { QueryZone } from "../components/queryZone";
import {
  PanelEditor,
  DisplayPanelType,
  PanelEditorConfig,
  DEFAULT_COLORS,
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
    colors: DEFAULT_COLORS,
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
    setEditorConfig({ ...config, colors: config.colors || DEFAULT_COLORS });
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
  const [tempData, setTempData] = useState<ExecuteQueryResponse>();

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

  const { mutate: updateQuery } = useUpdateQuery();
  const { mutate: updatePanel } = useUpdatePanel();

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

    if (editorConfig.colors?.length) {
      baseSpec.color = editorConfig.colors;
    }

    if (editorConfig.label?.visible) {
      baseSpec.label = { visible: true };
    }

    switch (displayType) {
      case "line":
      case "bar":
      case "area":
        return {
          ...baseSpec,
          xField: editorConfig.xField,
          yField: editorConfig.yField,
          seriesField: editorConfig.seriesField,
        };
      case "pie":
        return {
          ...baseSpec,
          categoryField: editorConfig.categoryField,
          valueField: editorConfig.valueField,
        };
      case "scatter":
        return {
          ...baseSpec,
          xField: editorConfig.xField,
          yField: editorConfig.yField,
          seriesField: editorConfig.seriesField,
          sizeField: editorConfig.sizeField,
        };
      case "radar":
        return {
          ...baseSpec,
          categoryField: editorConfig.categoryField,
          valueField: editorConfig.valueField,
          seriesField: editorConfig.seriesField,
        };
      default:
        return baseSpec;
    }
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
