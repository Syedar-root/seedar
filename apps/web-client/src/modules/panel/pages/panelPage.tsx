import {
  SeedarPanel,
  useDataset,
  useExecuteTempQuery,
  useQuery,
  useUpdateQuery,
} from "#pkg/seedar/ui-react";
import { useParams } from "react-router-dom";
import styles from "./styles/panel.module.scss";
import { usePanel } from "#pkg/seedar/ui-react";
import {
  ExecuteQueryResponse,
  PanelResponse,
  QueryResponse,
} from "#pkg/seedar/types";
import { Aside } from "../components/aside";
import { QueryZone } from "../components/queryZone";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DragItem } from "../components/dndHelper/dragZone/dragZone";
import { toast } from "sonner";

export const PanelPage = () => {
  const { panelId } = useParams();
  if (!panelId) {
    //TODO: 处理 panelId 不存在的情况
    return null;
  }

  const [dropFields, setDropFields] = useState<DragItem[]>([]);
  const [dropMetrics, setDropMetrics] = useState<DragItem[]>([]);

  const { data: panelData } = usePanel(panelId);

  const { data: queryData } = useQuery((panelData as PanelResponse)?.queryId!);

  const { data: datasetData } = useDataset(queryData?.datasetId!);

  useEffect(() => {
    if (!queryData) return;
    console.log(queryData);
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
  }, [dropFields, dropMetrics, executeTempQuery]);

  const { mutate: updateQuery } = useUpdateQuery();
  const handleSave = useCallback(() => {
    if (!panelData) return;
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
        onSuccess: async (data) => {
          handleRun();
          toast.success("保存成功");
        },
      },
    );
  }, [dropFields, dropMetrics, panelData, updateQuery]);

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <Aside
          fields={datasetData?.fields || []}
          metrics={datasetData?.metrics || []}
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
          <SeedarPanel showHeader={false} panelId={panelId} data={tempData} />
        </main>
      </main>
    </div>
  );
};
