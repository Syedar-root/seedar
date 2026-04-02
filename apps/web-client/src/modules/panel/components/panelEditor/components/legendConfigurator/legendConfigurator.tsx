import styles from "./legendConfigurator.module.scss";
import type { LegendConfig, LegendOrient, LegendLayout } from "../../types";
import { LEGEND_ORIENT_OPTIONS, LEGEND_LAYOUT_OPTIONS } from "../../types";
import { Select } from "@base-ui/react/select";
import { Checkbox } from "@base-ui/react/checkbox";
import { Input } from "@base-ui/react/input";
import { ChevronsUpDown, Check } from "lucide-react";

const ORIENT_LABEL_MAP = Object.fromEntries(
  LEGEND_ORIENT_OPTIONS.map((o) => [o.value, o.label]),
) as Record<LegendOrient, string>;

const LAYOUT_LABEL_MAP = Object.fromEntries(
  LEGEND_LAYOUT_OPTIONS.map((o) => [o.value, o.label]),
) as Record<LegendLayout, string>;

interface LegendConfiguratorProps {
  config: LegendConfig;
  onChange: (config: LegendConfig) => void;
}

export const LegendConfigurator: React.FC<LegendConfiguratorProps> = ({
  config,
  onChange,
}) => {
  const handleVisibleChange = (checked: boolean | string | number) => {
    onChange({ ...config, visible: !!checked });
  };

  const handleOrientChange = (value: string | null) => {
    if (!value) return;
    const orient = value as LegendOrient;
    const layout =
      orient === "left" || orient === "right" ? "vertical" : "horizontal";
    onChange({ ...config, orient, layout });
  };

  const handleLayoutChange = (value: string | null) => {
    if (!value) return;
    onChange({ ...config, layout: value as LegendLayout });
  };

  const handleTitleChange = (value: string) => {
    onChange({ ...config, title: value || undefined });
  };

  return (
    <div className={styles.legendConfigurator}>
      <div className={styles.title}>图例配置</div>
      <div className={styles.row}>
        <label className={styles.label}>显示图例</label>
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
      {config.visible && (
        <>
          <div className={styles.row}>
            <label className={styles.label}>位置</label>
            <Select.Root
              value={config.orient}
              onValueChange={handleOrientChange}
            >
              <Select.Trigger className={styles.trigger}>
                <Select.Value>
                  {(value: LegendOrient | null) =>
                    value ? ORIENT_LABEL_MAP[value] : ""
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
                      {LEGEND_ORIENT_OPTIONS.map((option) => (
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
          <div className={styles.row}>
            <label className={styles.label}>布局</label>
            <Select.Root
              value={config.layout}
              onValueChange={handleLayoutChange}
            >
              <Select.Trigger className={styles.trigger}>
                <Select.Value>
                  {(value: LegendLayout | null) =>
                    value ? LAYOUT_LABEL_MAP[value] : ""
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
                      {LEGEND_LAYOUT_OPTIONS.map((option) => (
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
          <div className={styles.row}>
            <label className={styles.label}>标题</label>
            <Input
              value={config.title || ""}
              onValueChange={handleTitleChange}
              placeholder="请输入标题"
              className={styles.input}
            />
          </div>
        </>
      )}
    </div>
  );
};
