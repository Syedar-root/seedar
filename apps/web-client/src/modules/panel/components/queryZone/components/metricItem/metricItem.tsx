import React, { useCallback } from "react";
import styles from "./metricItem.module.scss";
import { ChevronDownIcon, X } from "lucide-react";
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
          {hasPopConfig && <span className={styles.configBadge}>●</span>}
          <ChevronDownIcon className={styles.chevronIcon} size={12} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.menuPositioner} sideOffset={8}>
            <Menu.Popup className={styles.menuDropdown}>
              <Menu.Item className={styles.menuItem} onClick={handlePopDialog}>
                {hasPopConfig ? "编辑同环比" : "配置同环比"}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <X size={12} onClick={handleRemove} />
    </div>
  );
};
