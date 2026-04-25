import React from "react";
import styles from "./tempMetricItem.module.scss";
import { X } from "lucide-react";
import type { TempMetricConfig } from "../../../../types";

export interface TempMetricItemProps {
  tempMetric: TempMetricConfig;
  onRemove?: (tempMetricId: string) => void;
}

export const TempMetricItem = ({
  tempMetric,
  onRemove,
}: TempMetricItemProps) => {
  const handleRemove = () => {
    onRemove?.(tempMetric.id);
  };

  return (
    <div className={styles.tempMetric}>
      <span className={styles.name}>{tempMetric.businessName}</span>
      <X size={12} onClick={handleRemove} />
    </div>
  );
};
