import { DatasetResponse } from '#pkg/seedar/types';
import { useMemo } from 'react';
import styles from './aside.module.scss';
import { DragItem } from '../dndHelper/drapItem';

interface AsideProps {
  className?: string;
  fields: DatasetResponse['fields'];
  metrics: DatasetResponse['metrics'];
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
        >
          {field.name}
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
        >
          {metric.name}
        </DragItem>
      )),
    [metrics],
  );

  return (
    <aside className={className || styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h1 className={styles.sidebarTitle}>Seedar</h1>
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
