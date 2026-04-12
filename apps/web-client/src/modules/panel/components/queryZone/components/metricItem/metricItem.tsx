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
  hasPopConfig?: boolean;
}

export const MetricItem = ({
  metric,
  onRemove,
  onOpenPopDialog,
  hasPopConfig,
}: MetricItemProps) => {
  const handleRemove = () => {
    onRemove(metric);
  };

  const handlePopDialog = useCallback(() => {
    onOpenPopDialog(metric);
  }, [metric, onOpenPopDialog]);

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
              <Menu.Arrow className={styles.Arrow}>
                <ChevronDownIcon size={12} />
              </Menu.Arrow>
              <Menu.Item
                onClick={handlePopDialog}
                className={styles.CheckboxItem}
              >
                <span className={styles.CheckboxItemIndicator}>
                  {hasPopConfig && (
                    <Check
                      className={styles.CheckboxItemIndicatorIcon}
                      size={12}
                    />
                  )}
                </span>
                <span className={styles.CheckboxItemText}>同环比</span>
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <X size={12} onClick={handleRemove} />
    </div>
  );
};
