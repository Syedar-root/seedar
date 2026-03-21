import { DatasetResponse } from "#pkg/seedar/types";
import { useMemo } from "react";
import styles from "./aside.module.scss";
import { DragItem } from "../dndHelper/drapItem";
import clsx from "clsx";

interface AsideProps {
  className?: string;
  fields: DatasetResponse["fields"];
  metrics: DatasetResponse["metrics"];
}

export const Aside: React.FC<AsideProps> = ({
  className,
  fields,
  metrics,
}: AsideProps) => {
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
            backgroundColor: "#7fc2f8",
          }}
        >
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
            backgroundColor: "#a9fa8a",
          }}
        >
          {metric.businessName || metric.name}
        </DragItem>
      )),
    [metrics],
  );

  return (
    <aside className={clsx(styles.sidebar, className)}>
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarDesc}>选择字段和指标，构建查询</span>
      </div>
      <div className={styles.sidebarContent}>
        <div className={styles.sidebarSection}>
          <h2 className={styles.sidebarSectionTitle}>字段</h2>
          <ul className={styles.sidebarList}>{fieldItems}</ul>
        </div>
        <div className={styles.sidebarSection}>
          <h2 className={styles.sidebarSectionTitle}>指标</h2>
          <ul className={styles.sidebarList}>{metricItems}</ul>
        </div>
      </div>
    </aside>
  );
};
