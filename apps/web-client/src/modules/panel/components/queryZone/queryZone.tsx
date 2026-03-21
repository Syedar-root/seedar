import React from "react";
import styles from "./queryZone.module.scss";
import { DragZone } from "../dndHelper";
import { DragItem } from "../dndHelper/dragZone/dragZone";
import { X } from "lucide-react";

// 🔥 定义组件Props类型
interface QueryZoneProps {
  // 放置成功的回调函数（TS严格约束参数）
  onDropField: (item: DragItem) => void;
  onDropMetric: (item: DragItem) => void;
  onRemoveField: (item: DragItem) => void;
  onRemoveMetric: (item: DragItem) => void;
  dropFields: DragItem[];
  dropMetrics: DragItem[];
}

export const QueryZone: React.FC<QueryZoneProps> = ({
  onDropField,
  onDropMetric,
  onRemoveField,
  onRemoveMetric,
  dropFields,
  dropMetrics,
}) => {
  return (
    <div className={styles.queryZone}>
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
  );
};
