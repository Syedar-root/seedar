import React, { useCallback } from "react";
import styles from "./metricItem.module.scss";
import { ChevronDownIcon, X, Check } from "lucide-react";
import { DragItem } from "../../../dndHelper/dragZone/dragZone";
import { Menu } from "@base-ui/react";
import { MetricWithPopConfig } from "../../queryZone";

export interface MetricItemProps {
  metric: MetricWithPopConfig;
  onRemove: (item: DragItem) => void;
  onOpenPopDialog: (metric: MetricWithPopConfig) => void;
  onOpenFormattingDialog: (metric: MetricWithPopConfig) => void;
  hasPopConfig?: boolean;
  hasFormattingConfig?: boolean;
}

export const MetricItem = ({
  metric,
  onRemove,
  onOpenPopDialog,
  onOpenFormattingDialog,
  hasPopConfig,
  hasFormattingConfig,
}: MetricItemProps) => {
  const handleRemove = () => {
    onRemove(metric);
  };

  const handlePopDialog = useCallback(() => {
    onOpenPopDialog(metric);
  }, [metric, onOpenPopDialog]);

  const handleFormattingDialog = useCallback(() => {
    onOpenFormattingDialog(metric);
  }, [metric, onOpenFormattingDialog]);

  return (
    <div className={styles.metric}>
      <Menu.Root>
        <Menu.Trigger className={styles.trigger}>
          {metric.businessName || metric.name}
          <ChevronDownIcon className={styles.chevronIcon} size={12} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.menuPositioner} sideOffset={8}>
            <Menu.Popup className={styles.Popup}>
              <Menu.Item
                onClick={handlePopDialog}
                className={styles.CheckboxItem}
              >
                <span className={styles.CheckboxItemText}>同比/环比</span>
                <span className={styles.CheckboxItemIndicator}>
                  {hasPopConfig && (
                    <Check
                      className={styles.CheckboxItemIndicatorIcon}
                      size={12}
                    />
                  )}
                </span>
              </Menu.Item>
              <Menu.Item
                onClick={handleFormattingDialog}
                className={styles.CheckboxItem}
              >
                <span className={styles.CheckboxItemText}>格式化</span>
                <span className={styles.CheckboxItemIndicator}>
                  {hasFormattingConfig && (
                    <Check
                      className={styles.CheckboxItemIndicatorIcon}
                      size={12}
                    />
                  )}
                </span>
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <X size={12} onClick={handleRemove} />
    </div>
  );
};
