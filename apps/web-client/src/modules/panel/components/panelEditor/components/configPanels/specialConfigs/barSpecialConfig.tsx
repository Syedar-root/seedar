import { Select } from "@base-ui/react/select";
import { ChevronsUpDown } from "lucide-react";
import {
  BAR_DIRECTION_OPTIONS,
  type BarDirection,
  type ConfigPanelProps,
} from "../../../types";
import styles from "./chartSpecialConfig.module.scss";

const DIRECTION_LABEL_MAP = Object.fromEntries(
  BAR_DIRECTION_OPTIONS.map((option) => [option.value, option.label]),
) as Record<BarDirection, string>;

export const BarSpecialConfig: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
}) => {
  const value = config.direction || "vertical";

  return (
    <div className={styles.specialConfig}>
      <div className={styles.title}>柱状图专属配置</div>
      <div className={styles.row}>
        <label className={styles.label}>显示方向</label>
        <Select.Root
          value={value}
          onValueChange={(nextValue) => {
            if (!nextValue) {
              return;
            }
            onChange({ direction: nextValue as BarDirection });
          }}
        >
          <Select.Trigger className={styles.trigger}>
            <Select.Value>
              {(currentValue: BarDirection | null) =>
                currentValue ? DIRECTION_LABEL_MAP[currentValue] : ""
              }
            </Select.Value>
            <Select.Icon className={styles.icon}>
              <ChevronsUpDown size={14} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner className={styles.positioner}>
              <Select.Popup className={styles.popup}>
                <Select.List className={styles.list}>
                  {BAR_DIRECTION_OPTIONS.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      className={styles.item}
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>
    </div>
  );
};
