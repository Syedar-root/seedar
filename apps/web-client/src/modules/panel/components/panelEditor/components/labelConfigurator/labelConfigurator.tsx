import styles from "./labelConfigurator.module.scss";
import type { LabelConfig } from "../../types";
import { Checkbox } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";

interface LabelConfiguratorProps {
  config: LabelConfig;
  onChange: (config: LabelConfig) => void;
}

export const LabelConfigurator: React.FC<LabelConfiguratorProps> = ({
  config,
  onChange,
}) => {
  const handleVisibleChange = (visible: boolean) => {
    onChange({ visible });
  };

  return (
    <div className={styles.labelConfigurator}>
      <div className={styles.title}>标签配置</div>
      <div className={styles.row}>
        <label className={styles.label}>显示标签</label>
        <Checkbox.Root
          checked={config.visible}
          onCheckedChange={handleVisibleChange}
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
