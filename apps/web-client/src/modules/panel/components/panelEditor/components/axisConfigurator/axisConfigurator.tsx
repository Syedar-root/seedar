import { Checkbox } from "@base-ui/react/checkbox";
import { Input } from "@base-ui/react/input";
import { Select } from "@base-ui/react/select";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { AxisConfig, AxisScaleType } from "../../types";
import styles from "./axisConfigurator.module.scss";

interface AxisConfiguratorProps {
  config: AxisConfig;
  onChange: (config: AxisConfig) => void;
}

type AxisKey = "x" | "y";
type NumericFieldKey = "logBase" | "min" | "max" | "labelRotate";
type AxisNumericDraft = Record<NumericFieldKey, string>;
type AxisDraftState = Record<AxisKey, AxisNumericDraft>;

const AXIS_SCALE_OPTIONS: Array<{ value: AxisScaleType; label: string }> = [
  { value: "linear", label: "线性轴" },
  { value: "log", label: "对数轴" },
];

const AXIS_SCALE_LABEL_MAP = Object.fromEntries(
  AXIS_SCALE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<AxisScaleType, string>;

const toInputValue = (value: number | undefined): string =>
  typeof value === "number" && Number.isFinite(value) ? String(value) : "";

const parseOptionalNumber = (value: string): number | undefined => {
  const next = value.trim();
  if (!next) {
    return undefined;
  }

  const parsed = Number(next);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const createDraft = (config: AxisConfig): AxisDraftState => ({
  x: {
    logBase: toInputValue(config.x.logBase),
    min: toInputValue(config.x.min),
    max: toInputValue(config.x.max),
    labelRotate: toInputValue(config.x.labelRotate),
  },
  y: {
    logBase: toInputValue(config.y.logBase),
    min: toInputValue(config.y.min),
    max: toInputValue(config.y.max),
    labelRotate: toInputValue(config.y.labelRotate),
  },
});

const isValidLogBase = (value: number): boolean =>
  Number.isFinite(value) && value > 0 && value !== 1;

export const AxisConfigurator: React.FC<AxisConfiguratorProps> = ({
  config,
  onChange,
}) => {
  const [draft, setDraft] = useState<AxisDraftState>(() => createDraft(config));

  useEffect(() => {
    setDraft(createDraft(config));
  }, [config]);

  const updateAxis = (
    axisKey: AxisKey,
    patch: Partial<AxisConfig[AxisKey]>,
  ) => {
    onChange({
      ...config,
      [axisKey]: {
        ...config[axisKey],
        ...patch,
      },
    });
  };

  const updateDraft = (
    axisKey: AxisKey,
    field: NumericFieldKey,
    value: string,
  ) => {
    setDraft((previous) => ({
      ...previous,
      [axisKey]: {
        ...previous[axisKey],
        [field]: value,
      },
    }));
  };

  const resetDraftField = (axisKey: AxisKey, field: NumericFieldKey) => {
    setDraft((previous) => ({
      ...previous,
      [axisKey]: {
        ...previous[axisKey],
        [field]: toInputValue(config[axisKey][field] as number | undefined),
      },
    }));
  };

  const commitNumberField = (
    axisKey: AxisKey,
    field: NumericFieldKey,
    validator?: (value: number) => boolean,
  ) => {
    const rawValue = draft[axisKey][field];
    const parsed = parseOptionalNumber(rawValue);

    if (parsed === undefined) {
      updateAxis(axisKey, { [field]: undefined });
      return;
    }

    if (validator && !validator(parsed)) {
      resetDraftField(axisKey, field);
      return;
    }

    updateAxis(axisKey, { [field]: parsed });
  };

  const handleScaleTypeChange = (axisKey: AxisKey, value: AxisScaleType) => {
    if (axisKey === "y" && value === "log") {
      updateAxis(axisKey, {
        scaleType: value,
        zero: false,
      });
      return;
    }

    updateAxis(axisKey, { scaleType: value });
  };

  const handleBooleanChange = (
    axisKey: AxisKey,
    key: keyof AxisConfig[AxisKey],
    checked: boolean | string | number,
  ) => {
    updateAxis(axisKey, { [key]: Boolean(checked) });
  };

  const renderAxisSection = (axisKey: AxisKey, title: string) => {
    const axisConfig = config[axisKey];
    const scaleType = (axisConfig.scaleType || "linear") as AxisScaleType;

    return (
      <div className={styles.axisSection}>
        <div className={styles.axisTitle}>{title}</div>

        <div className={styles.row}>
          <label className={styles.label}>显示坐标轴</label>
          <Checkbox.Root
            checked={axisConfig.visible}
            onCheckedChange={(checked) =>
              handleBooleanChange(axisKey, "visible", checked)
            }
            className={styles.checkbox}
          >
            <Checkbox.Indicator className={styles.checkboxIndicator}>
              <Check size={14} />
            </Checkbox.Indicator>
          </Checkbox.Root>
        </div>

        {axisConfig.visible && (
          <>
            <div className={styles.row}>
              <label className={styles.label}>坐标轴类型</label>
              <Select.Root
                value={scaleType}
                onValueChange={(value) => {
                  if (!value) {
                    return;
                  }
                  handleScaleTypeChange(axisKey, value as AxisScaleType);
                }}
              >
                <Select.Trigger className={styles.trigger}>
                  <Select.Value>
                    {(value: AxisScaleType | null) =>
                      value ? AXIS_SCALE_LABEL_MAP[value] : ""
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
                        {AXIS_SCALE_OPTIONS.map((option) => (
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

            {scaleType === "log" && (
              <div className={styles.row}>
                <label className={styles.label}>对数底数</label>
                <Input
                  value={draft[axisKey].logBase}
                  onValueChange={(value) =>
                    updateDraft(axisKey, "logBase", value)
                  }
                  onBlur={() =>
                    commitNumberField(axisKey, "logBase", isValidLogBase)
                  }
                  placeholder="如 10 或 2"
                  className={styles.input}
                />
              </div>
            )}

            <div className={styles.row}>
              <label className={styles.label}>最小值</label>
              <Input
                value={draft[axisKey].min}
                onValueChange={(value) => updateDraft(axisKey, "min", value)}
                onBlur={() => commitNumberField(axisKey, "min")}
                placeholder="自动"
                className={styles.input}
              />
            </div>

            <div className={styles.row}>
              <label className={styles.label}>最大值</label>
              <Input
                value={draft[axisKey].max}
                onValueChange={(value) => updateDraft(axisKey, "max", value)}
                onBlur={() => commitNumberField(axisKey, "max")}
                placeholder="自动"
                className={styles.input}
              />
            </div>

            <div className={styles.row}>
              <label className={styles.label}>平滑刻度</label>
              <Checkbox.Root
                checked={axisConfig.nice ?? true}
                onCheckedChange={(checked) =>
                  handleBooleanChange(axisKey, "nice", checked)
                }
                className={styles.checkbox}
              >
                <Checkbox.Indicator className={styles.checkboxIndicator}>
                  <Check size={14} />
                </Checkbox.Indicator>
              </Checkbox.Root>
            </div>

            <div className={styles.row}>
              <label className={styles.label}>显示标签</label>
              <Checkbox.Root
                checked={axisConfig.labelVisible}
                onCheckedChange={(checked) =>
                  handleBooleanChange(axisKey, "labelVisible", checked)
                }
                className={styles.checkbox}
              >
                <Checkbox.Indicator className={styles.checkboxIndicator}>
                  <Check size={14} />
                </Checkbox.Indicator>
              </Checkbox.Root>
            </div>

            {axisConfig.labelVisible && (
              <div className={styles.row}>
                <label className={styles.label}>标签旋转角度</label>
                <Input
                  value={draft[axisKey].labelRotate}
                  onValueChange={(value) =>
                    updateDraft(axisKey, "labelRotate", value)
                  }
                  onBlur={() => commitNumberField(axisKey, "labelRotate")}
                  placeholder="0"
                  className={styles.input}
                />
              </div>
            )}

            <div className={styles.row}>
              <label className={styles.label}>显示刻度</label>
              <Checkbox.Root
                checked={axisConfig.tickVisible}
                onCheckedChange={(checked) =>
                  handleBooleanChange(axisKey, "tickVisible", checked)
                }
                className={styles.checkbox}
              >
                <Checkbox.Indicator className={styles.checkboxIndicator}>
                  <Check size={14} />
                </Checkbox.Indicator>
              </Checkbox.Root>
            </div>

            <div className={styles.row}>
              <label className={styles.label}>显示网格线</label>
              <Checkbox.Root
                checked={axisConfig.gridVisible}
                onCheckedChange={(checked) =>
                  handleBooleanChange(axisKey, "gridVisible", checked)
                }
                className={styles.checkbox}
              >
                <Checkbox.Indicator className={styles.checkboxIndicator}>
                  <Check size={14} />
                </Checkbox.Indicator>
              </Checkbox.Root>
            </div>

            {axisKey === "y" && scaleType !== "log" && (
              <div className={styles.row}>
                <label className={styles.label}>从 0 开始</label>
                <Checkbox.Root
                  checked={axisConfig.zero ?? true}
                  onCheckedChange={(checked) =>
                    handleBooleanChange(axisKey, "zero", checked)
                  }
                  className={styles.checkbox}
                >
                  <Checkbox.Indicator className={styles.checkboxIndicator}>
                    <Check size={14} />
                  </Checkbox.Indicator>
                </Checkbox.Root>
              </div>
            )}

            <div className={styles.row}>
              <label className={styles.label}>轴标题</label>
              <Input
                value={axisConfig.title || ""}
                onValueChange={(value) =>
                  updateAxis(axisKey, { title: value || undefined })
                }
                placeholder={`请输入${axisKey === "x" ? "X" : "Y"}轴标题`}
                className={styles.input}
              />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={styles.axisConfigurator}>
      <div className={styles.title}>坐标轴配置</div>
      {renderAxisSection("x", "X 轴")}
      <div className={styles.divider} />
      {renderAxisSection("y", "Y 轴")}
    </div>
  );
};
