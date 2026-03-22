import styles from "./legendConfigurator.module.scss";
import type { LegendConfig, LegendOrient, LegendLayout } from "../../types";
import {
  LEGEND_ORIENT_OPTIONS,
  LEGEND_LAYOUT_OPTIONS,
} from "../../types";

interface LegendConfiguratorProps {
  config: LegendConfig;
  onChange: (config: LegendConfig) => void;
}

export const LegendConfigurator: React.FC<LegendConfiguratorProps> = ({
  config,
  onChange,
}) => {
  const handleVisibleChange = (visible: boolean) => {
    onChange({ ...config, visible });
  };

  const handleOrientChange = (orient: LegendOrient) => {
    const layout = orient === 'left' || orient === 'right' ? 'vertical' : 'horizontal';
    onChange({ ...config, orient, layout });
  };

  const handleLayoutChange = (layout: LegendLayout) => {
    onChange({ ...config, layout });
  };

  const handleTitleChange = (title: string) => {
    onChange({ ...config, title: title || undefined });
  };

  return (
    <div className={styles.legendConfigurator}>
      <div className={styles.title}>图例配置</div>
      <div className={styles.row}>
        <label className={styles.label}>显示图例</label>
        <input
          type="checkbox"
          checked={config.visible}
          onChange={(e) => handleVisibleChange(e.target.checked)}
          className={styles.checkbox}
        />
      </div>
      {config.visible && (
        <>
          <div className={styles.row}>
            <label className={styles.label}>位置</label>
            <select
              value={config.orient}
              onChange={(e) => handleOrientChange(e.target.value as LegendOrient)}
              className={styles.select}
            >
              {LEGEND_ORIENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.row}>
            <label className={styles.label}>布局</label>
            <select
              value={config.layout}
              onChange={(e) => handleLayoutChange(e.target.value as LegendLayout)}
              className={styles.select}
            >
              {LEGEND_LAYOUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.row}>
            <label className={styles.label}>标题</label>
            <input
              type="text"
              value={config.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="请输入标题"
              className={styles.input}
            />
          </div>
        </>
      )}
    </div>
  );
};
