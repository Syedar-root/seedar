import { SeedarPanel, useDataset, useQuery } from '#pkg/seedar/ui-react';
import { useParams } from 'react-router-dom';
import styles from './styles/panel.module.scss';
import { usePanel } from '#pkg/seedar/ui-react';
import { PanelResponse, QueryResponse } from '#pkg/seedar/types';
import { Aside } from '../components/aside';
import { QueryZone } from '../components/queryZone';
import { useCallback, useMemo, useState } from 'react';
import { DragItem } from '../components/dndHelper/dragZone/dragZone';

export const PanelPage = () => {
  const { panelId } = useParams();
  if (!panelId) {
    //TODO: 处理 panelId 不存在的情况
    return null;
  }
  const { data: panelData } = usePanel(panelId);

  const { data: queryData } = useQuery((panelData as PanelResponse)?.queryId!);

  const { data: datasetData } = useDataset(queryData?.datasetId!);

  const [dropFields, setDropFields] = useState<DragItem[]>([]);
  const [dropMetrics, setDropMetrics] = useState<DragItem[]>([]);

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
            dropFields={dropFields}
            dropMetrics={dropMetrics}
          />
        </header>
        <main className={styles.mainContent}>
          <SeedarPanel showHeader={false} panelId={panelId} />
        </main>
      </main>
    </div>
  );
};
