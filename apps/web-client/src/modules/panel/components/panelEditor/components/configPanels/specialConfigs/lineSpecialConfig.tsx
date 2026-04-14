import { Checkbox } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
import type { ConfigPanelProps } from "../../../types";
import styles from "./chartSpecialConfig.module.scss";

export const LineSpecialConfig: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
}) => {
  if (config.isAdvancedSpecMode) {
    return null;
  }

  return (
    <div className={styles.specialConfig}>
      <div className={styles.title}>折线图专属配置</div>
      <div className={styles.row}>
        <label className={styles.label}>平滑曲线</label>
        <Checkbox.Root
          checked={config.smooth ?? false}
          onCheckedChange={(checked) => onChange({ smooth: Boolean(checked) })}
          className={styles.checkbox}
        >
          <Checkbox.Indicator className={styles.checkboxIndicator}>
            <Check size={14} />
          </Checkbox.Indicator>
        </Checkbox.Root>
      </div>
    </div>
  );
};
