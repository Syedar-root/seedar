import { DatasetResponse } from "#pkg/seedar/types";
import { useMemo, useState } from "react";
import styles from "./aside.module.scss";
import { DragItem } from "../dndHelper/drapItem";
import clsx from "clsx";
import { GripVertical, Plus } from "lucide-react";
import { MetricEditorDialog } from "./metricEditorDialog";

interface AsideProps {
  className?: string;
  fields: DatasetResponse["fields"];
  metrics: DatasetResponse["metrics"];
  datasetId?: number;
  onMetricCreated?: () => void;
}

export const Aside: React.FC<AsideProps> = ({
  className,
  fields,
  metrics,
  datasetId,
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
    () => fields.filter((f) => f.type === "number" || f.type === "decimal"),
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
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarDesc}>选择字段和指标，构建查询</span>
        <span className={styles.sidebarHint}>拖拽到右侧区域使用</span>
      </div>
      <div className={styles.sidebarContent}>
        <div className={styles.sidebarSection}>
          <h2 className={styles.sidebarSectionTitle}>字段</h2>
          <ul className={styles.sidebarList}>{fieldItems}</ul>
        </div>
        <div className={styles.sidebarSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sidebarSectionTitle}>指标</h2>
            {datasetId && (
              <button
                className={styles.addButton}
                onClick={handleOpenMetricEditor}
                title="添加指标"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
          <ul className={styles.sidebarList}>{metricItems}</ul>
        </div>
      </div>
      {datasetId && isMetricEditorOpen && (
        <MetricEditorDialog
          datasetId={datasetId}
          fields={fields}
          metrics={metrics}
          numericFields={numericFields}
          onClose={handleCloseMetricEditor}
          onSuccess={handleMetricCreated}
        />
      )}
    </aside>
  );
};
