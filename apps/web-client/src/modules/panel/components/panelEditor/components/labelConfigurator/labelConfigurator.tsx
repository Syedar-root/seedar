import styles from "./labelConfigurator.module.scss";
import type { LabelConfig } from "../../types";

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
        <input
          type="checkbox"
          checked={config.visible}
          onChange={(e) => handleVisibleChange(e.target.checked)}
          className={styles.checkbox}
        />
      </div>
    </div>
  );
};
