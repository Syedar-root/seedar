import React from "react";
import styles from "./queryZone.module.scss";
import { DragZone } from "../dndHelper";
import { DragItem } from "../dndHelper/dragZone/dragZone";
import { X } from "lucide-react";
import { FilterItem } from "./filterItem";
import { FilterItem as FilterItemType } from "./types";

interface QueryZoneProps {
  onDropField: (item: DragItem) => void;
  onDropMetric: (item: DragItem) => void;
  onDropFilter: (item: DragItem) => void;
  onRemoveField: (item: DragItem) => void;
  onRemoveMetric: (item: DragItem) => void;
  onRemoveFilter: (id: string | number) => void;
  onUpdateFilter: (
    id: string | number,
    updates: Partial<FilterItemType>,
  ) => void;
  dropFields: DragItem[];
  dropMetrics: DragItem[];
  dropFilters: FilterItemType[];
}

export const QueryZone: React.FC<QueryZoneProps> = ({
  onDropField,
  onDropMetric,
  onDropFilter,
  onRemoveField,
  onRemoveMetric,
  onRemoveFilter,
  onUpdateFilter,
  dropFields,
  dropMetrics,
  dropFilters,
}) => {
  return (
    <div className={styles.queryZone}>
      <div className={styles.zone}>
        <div className={styles.title}>维度</div>
        <DragZone
          className={styles.dragZone}
          onDrop={onDropField}
          itemType="fieldItem"
          overColor="#e6f7ff"
        >
          {dropFields.map((item) => (
            <div className={styles.field} key={item.id}>
              {item.businessName || item.name}
              <X size={12} onClick={() => onRemoveField(item)} />
            </div>
          ))}
        </DragZone>
      </div>
      <div className={styles.zone}>
        <div className={styles.title}>指标</div>
        <DragZone
          className={styles.dragZone}
          onDrop={onDropMetric}
          itemType="metricItem"
          overColor="#e6f7ff"
        >
          {dropMetrics.map((item) => (
            <div className={styles.metric} key={item.id}>
              {item.businessName || item.name}
              <X size={12} onClick={() => onRemoveMetric(item)} />
            </div>
          ))}
        </DragZone>
      </div>
      <div className={styles.zone}>
        <div className={styles.title}>筛选</div>
        <DragZone
          className={styles.dragZone}
          onDrop={onDropFilter}
          itemType="fieldItem"
          overColor="#e6f7ff"
        >
          {dropFilters.map((filter) => (
            <FilterItem
              key={filter.id}
              filter={filter}
              onUpdate={onUpdateFilter}
              onRemove={onRemoveFilter}
            />
          ))}
        </DragZone>
      </div>
    </div>
  );
};
