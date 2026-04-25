import type { DatasetResponse } from "#pkg/seedar/types";
import { useMemo, useState } from "react";
import clsx from "clsx";
import styles from "./aside.module.scss";
import { DragItem } from "../dndHelper/drapItem";
import { Database, GripVertical, Plus } from "lucide-react";
import { MetricEditorDialog } from "../metricEditor";
import { ScrollArea } from "@/core/components/ui/ScrollArea";

const COPY = {
  datasetLabel: "\u6570\u636e\u96c6",
  datasetHintSelected:
    "\u5b57\u6bb5\u548c\u6307\u6807\u4f1a\u8ddf\u968f\u5f53\u524d\u6570\u636e\u96c6\u53d8\u5316",
  datasetEmptyTitle: "\u5c1a\u672a\u9009\u62e9\u6570\u636e\u96c6",
  datasetHintEmpty:
    "\u5148\u9009\u62e9\u4e00\u4e2a\u6570\u636e\u96c6\uff0c\u518d\u62d6\u62fd\u5b57\u6bb5\u548c\u6307\u6807\u6784\u5efa\u67e5\u8be2",
  datasetActionChange: "\u66f4\u6362\u6570\u636e\u96c6",
  datasetActionLocked: "\u6570\u636e\u96c6\u5df2\u9501\u5b9a",
  datasetActionSelect: "\u9009\u62e9\u6570\u636e\u96c6",
  sidebarDesc: "\u9009\u62e9\u5b57\u6bb5\u548c\u6307\u6807\uff0c\u6784\u5efa\u67e5\u8be2",
  sidebarHint: "\u62d6\u62fd\u5230\u53f3\u4fa7\u533a\u57df\u5373\u53ef\u4f7f\u7528",
  emptyTitle: "\u7b49\u5f85\u6570\u636e\u96c6",
  emptyDesc:
    "\u6570\u636e\u96c6\u9009\u5b9a\u540e\uff0c\u8fd9\u91cc\u4f1a\u5c55\u793a\u53ef\u62d6\u62fd\u7684\u5b57\u6bb5\u548c\u6307\u6807\u3002",
  fieldsTitle: "\u5b57\u6bb5",
  metricsTitle: "\u6307\u6807",
  addMetricTitle: "\u6dfb\u52a0\u6307\u6807",
} as const;

interface AsideProps {
  className?: string;
  fields: DatasetResponse["fields"];
  metrics: DatasetResponse["metrics"];
  datasetId?: number;
  datasetName?: string;
  hasDataset: boolean;
  canChangeDataset?: boolean;
  onOpenDatasetSelector: () => void;
  onMetricCreated?: () => void;
}

export const Aside: React.FC<AsideProps> = ({
  className,
  fields,
  metrics,
  datasetId,
  datasetName,
  hasDataset,
  canChangeDataset = true,
  onOpenDatasetSelector,
  onMetricCreated,
}) => {
  const [isMetricEditorOpen, setIsMetricEditorOpen] = useState(false);

  const handleOpenMetricEditor = () => {
    setIsMetricEditorOpen(true);
  };

  const handleCloseMetricEditor = () => {
    setIsMetricEditorOpen(false);
  };

  const handleMetricCreated = () => {
    setIsMetricEditorOpen(false);
    onMetricCreated?.();
  };

  const numericFields = useMemo(
    () =>
      fields.filter(
        (field) => field.type === "number" || field.type === "decimal",
      ),
    [fields],
  );

  const fieldItems = useMemo(
    () =>
      fields.map((field) => (
        <DragItem
          className={styles.dragItem}
          key={field.id}
          dragId={field.id}
          itemType="fieldItem"
          dragingStyle={{
            opacity: 0.5,
            backgroundColor: "var(--accent-1)",
          }}
        >
          <GripVertical className={styles.dragHandle} />
          {field.businessName || field.name}
        </DragItem>
      )),
    [fields],
  );

  const metricItems = useMemo(
    () =>
      metrics.map((metric) => (
        <DragItem
          className={styles.dragItem}
          key={metric.id}
          dragId={metric.id}
          itemType="metricItem"
          dragingStyle={{
            opacity: 0.5,
            backgroundColor: "var(--accent-2)",
          }}
        >
          <GripVertical className={styles.dragHandle} />
          {metric.businessName || metric.name}
        </DragItem>
      )),
    [metrics],
  );

  return (
    <aside className={clsx(styles.sidebar, className)}>
      <div className={styles.datasetCard}>
        <div className={styles.datasetMeta}>
          <span className={styles.datasetLabel}>{COPY.datasetLabel}</span>
          {hasDataset ? (
            <>
              <span className={styles.datasetName}>{datasetName}</span>
              <span className={styles.datasetHint}>
                {COPY.datasetHintSelected}
              </span>
            </>
          ) : (
            <>
              <span className={styles.datasetEmptyTitle}>
                {COPY.datasetEmptyTitle}
              </span>
              <span className={styles.datasetHint}>{COPY.datasetHintEmpty}</span>
            </>
          )}
        </div>
        <button
          type="button"
          className={styles.datasetAction}
          onClick={onOpenDatasetSelector}
          disabled={hasDataset && !canChangeDataset}
        >
          {hasDataset
            ? canChangeDataset
              ? COPY.datasetActionChange
              : COPY.datasetActionLocked
            : COPY.datasetActionSelect}
        </button>
      </div>

      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarDesc}>{COPY.sidebarDesc}</span>
        <span className={styles.sidebarHint}>{COPY.sidebarHint}</span>
      </div>

      {!hasDataset ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Database size={28} />
          </div>
          <div className={styles.emptyTitle}>{COPY.emptyTitle}</div>
          <div className={styles.emptyDesc}>{COPY.emptyDesc}</div>
        </div>
      ) : (
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarSection}>
            <h2 className={styles.sidebarSectionTitle}>{COPY.fieldsTitle}</h2>
            <ScrollArea className={styles.fieldList}>
              <ul className={styles.sidebarList}>{fieldItems}</ul>
            </ScrollArea>
          </div>
          <div className={styles.sidebarSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sidebarSectionTitle}>{COPY.metricsTitle}</h2>
              {datasetId ? (
                <button
                  className={styles.addButton}
                  onClick={handleOpenMetricEditor}
                  title={COPY.addMetricTitle}
                >
                  <Plus size={14} />
                </button>
              ) : null}
            </div>
            <ScrollArea className={styles.fieldList}>
              <ul className={styles.sidebarList}>{metricItems}</ul>
            </ScrollArea>
          </div>
        </div>
      )}

      {datasetId && isMetricEditorOpen ? (
        <MetricEditorDialog
          datasetId={datasetId}
          fields={fields}
          metrics={metrics}
          numericFields={numericFields}
          onClose={handleCloseMetricEditor}
          onSuccess={handleMetricCreated}
        />
      ) : null}
    </aside>
  );
};
