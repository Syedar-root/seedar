import type { ChangeEvent } from "react";
import { useEffect, useMemo } from "react";

import type { ComboboxOptionGroup } from "@/core/components/ui/Combobox";
import { Combobox } from "@/core/components/ui/Combobox";
import {
  METRIC_CARD_VARIANT_OPTIONS,
  type CardPanelConfig,
  type CardValuePickMode,
  type ConfigPanelProps,
  type MetricCardVariant,
} from "../../types";
import styles from "./cardConfigPanel.module.scss";

const DEFAULT_CARD_CONFIG: CardPanelConfig = {
  variant: "default",
  chartSmooth: true,
  valuePickMode: "last",
};

const TREND_OPTIONS = [
  { value: "none", label: "自动或不展示" },
  { value: "up", label: "上升" },
  { value: "down", label: "下降" },
] as const;

const VALUE_PICK_MODE_OPTIONS: Array<{
  value: CardValuePickMode;
  label: string;
}> = [
  { value: "last", label: "最后一条" },
  { value: "first", label: "第一条" },
];

const getCardConfig = (config: ConfigPanelProps["config"]): CardPanelConfig => ({
  ...DEFAULT_CARD_CONFIG,
  ...config.card,
});

const toOptionalNumber = (value: string): number | undefined => {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildOption = (value: string) => ({
  label: value,
  value,
});

const buildFieldOptions = (
  fields: ConfigPanelProps["fields"],
  metrics: ConfigPanelProps["metrics"],
  tempMetrics: ConfigPanelProps["tempMetrics"] = [],
): ComboboxOptionGroup[] => [
  {
    label: "维度",
    options: fields
      .map((item) => item.businessName ?? item.name ?? String(item.id))
      .filter((value): value is string => Boolean(value))
      .map(buildOption),
  },
  {
    label: "指标",
    options: metrics
      .map((item) => item.businessName ?? item.name ?? String(item.id))
      .filter((value): value is string => Boolean(value))
      .map(buildOption),
  },
  {
    label: "临时指标",
    options: tempMetrics
      .map((item) => item.businessName ?? item.alias ?? item.id)
      .map((value) => String(value))
      .filter((value): value is string => Boolean(value))
      .map(buildOption),
  },
];

const buildMetricOptions = (
  metrics: ConfigPanelProps["metrics"],
  tempMetrics: ConfigPanelProps["tempMetrics"] = [],
): ComboboxOptionGroup[] => [
  {
    label: "指标",
    options: metrics
      .map((item) => item.businessName ?? item.name ?? String(item.id))
      .filter((value): value is string => Boolean(value))
      .map(buildOption),
  },
  {
    label: "临时指标",
    options: tempMetrics
      .map((item) => item.businessName ?? item.alias ?? item.id)
      .map((value) => String(value))
      .filter((value): value is string => Boolean(value))
      .map(buildOption),
  },
];

export const CardConfigPanel: React.FC<ConfigPanelProps> = ({
  fields,
  metrics,
  tempMetrics = [],
  config,
  onChange,
}) => {
  const cardConfig = getCardConfig(config);
  const variant = cardConfig.variant ?? "default";
  const fieldOptions = useMemo(
    () => buildFieldOptions(fields, metrics, tempMetrics),
    [fields, metrics, tempMetrics],
  );
  const metricOptions = useMemo(
    () => buildMetricOptions(metrics, tempMetrics),
    [metrics, tempMetrics],
  );
  const metricOptionValues = useMemo(
    () =>
      metricOptions.flatMap((group) =>
        group.options.map((option) => option.value),
      ),
    [metricOptions],
  );

  const updateCardConfig = (patch: Partial<CardPanelConfig>) => {
    onChange({
      card: {
        ...cardConfig,
        ...patch,
      },
    });
  };

  const handleTextChange =
    (key: keyof CardPanelConfig) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      updateCardConfig({
        [key]: nextValue || undefined,
      });
    };

  useEffect(() => {
    if (cardConfig.valueField || metricOptionValues.length === 0) {
      return;
    }

    onChange({
      card: {
        ...cardConfig,
        valueField: metricOptionValues[metricOptionValues.length - 1],
      },
    });
  }, [cardConfig, cardConfig.valueField, metricOptionValues, onChange]);

  const renderFieldMapping = (
    key: keyof CardPanelConfig,
    label: string,
    placeholder: string,
    options: ComboboxOptionGroup[] = fieldOptions,
  ) => (
    <div className={styles.fieldItem}>
      <label className={styles.label}>{label}</label>
      <Combobox
        value={(cardConfig[key] as string | undefined) ?? null}
        onChange={(value) =>
          updateCardConfig({
            [key]: value || undefined,
          })
        }
        options={options}
        placeholder={placeholder}
        searchPlaceholder={`搜索${label}`}
        emptyText="没有匹配的数据项"
      />
    </div>
  );

  const renderPickMode = (
    key: "valuePickMode",
    label: string,
  ) => (
    <label className={styles.fieldItem}>
      <span className={styles.label}>{label}</span>
      <select
        className={styles.select}
        value={cardConfig[key] || "last"}
        onChange={(event) =>
          updateCardConfig({
            [key]: event.target.value as CardValuePickMode,
          })
        }
      >
        {VALUE_PICK_MODE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className={styles.cardConfigPanel}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>卡片样式</div>
          <p className={styles.sectionDescription}>
            先确定卡片类型，再配置对应的数据映射和展示方式。
          </p>
        </div>
        <div className={styles.variantGrid}>
          {METRIC_CARD_VARIANT_OPTIONS.map((option) => {
            const isActive = variant === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={`${styles.variantButton} ${isActive ? styles.active : ""}`}
                onClick={() =>
                  updateCardConfig({
                    variant: option.value as MetricCardVariant,
                  })
                }
              >
                <span className={styles.variantLabel}>{option.label}</span>
                <span className={styles.variantDescription}>
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>通用配置</div>
          <p className={styles.sectionDescription}>
            控制主值来源、取值方式和基础展示信息。
          </p>
        </div>
        <div className={styles.formGrid}>
          {renderFieldMapping(
            "valueField",
            "主值字段",
            "选择卡片主值字段",
            metricOptions,
          )}
          {renderPickMode("valuePickMode", "取值方式")}
          <label className={styles.fieldItem}>
            <span className={styles.label}>自定义标题</span>
            <input
              className={styles.input}
              value={cardConfig.title || ""}
              onChange={handleTextChange("title")}
              placeholder="为空时自动使用字段名"
            />
          </label>
          <label className={styles.fieldItem}>
            <span className={styles.label}>前缀</span>
            <input
              className={styles.input}
              value={cardConfig.prefix || ""}
              onChange={handleTextChange("prefix")}
              placeholder="例如 ￥、$"
            />
          </label>
          <label className={styles.fieldItem}>
            <span className={styles.label}>后缀</span>
            <input
              className={styles.input}
              value={cardConfig.suffix || ""}
              onChange={handleTextChange("suffix")}
              placeholder="例如 %、人、次"
            />
          </label>
          <label className={styles.fieldItem}>
            <span className={styles.label}>卡片宽度</span>
            <input
              className={styles.input}
              value={cardConfig.width ? String(cardConfig.width) : ""}
              onChange={handleTextChange("width")}
              placeholder="例如 360 或 100%"
            />
          </label>
        </div>
      </section>

      {variant === "default" ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>趋势说明</div>
            <p className={styles.sectionDescription}>
              为基础卡片补充变化值和变化率说明。
            </p>
          </div>
          <div className={styles.formGrid}>
            {renderFieldMapping(
              "changeValueField",
              "变化值字段",
              "可选，用于变化说明",
              metricOptions,
            )}
            <label className={styles.fieldItem}>
              <span className={styles.label}>趋势方向</span>
              <select
                className={styles.select}
                value={cardConfig.trendDirection || "none"}
                onChange={(event) =>
                  updateCardConfig({
                    trendDirection:
                      event.target.value as CardPanelConfig["trendDirection"],
                  })
                }
              >
                {TREND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.fieldItem}>
              <span className={styles.label}>变化率文案</span>
              <input
                className={styles.input}
                value={cardConfig.changeRate || ""}
                onChange={handleTextChange("changeRate")}
                placeholder="例如 +12.5%"
              />
            </label>
            <label className={styles.fieldItem}>
              <span className={styles.label}>变化值文案</span>
              <input
                className={styles.input}
                value={cardConfig.changeValue || ""}
                onChange={handleTextChange("changeValue")}
                placeholder="仅在没有字段值时兜底"
              />
            </label>
          </div>
        </section>
      ) : null}

      {variant === "withLineChart" ? (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>趋势图数据</div>
              <p className={styles.sectionDescription}>
                选择趋势图维度、数值，以及右侧说明中展示的变化值。
              </p>
            </div>
            <div className={styles.formGrid}>
              {renderFieldMapping(
                "chartXField",
                "图表 X 字段",
                "选择趋势图横轴字段",
              )}
              {renderFieldMapping(
                "chartYField",
                "图表 Y 字段",
                "选择趋势图数值字段",
              )}
              {renderFieldMapping(
                "changeValueField",
                "变化值字段",
                "可选，用于趋势说明",
                metricOptions,
              )}
              <label className={styles.fieldItem}>
                <span className={styles.label}>趋势方向</span>
                <select
                  className={styles.select}
                  value={cardConfig.trendDirection || "none"}
                  onChange={(event) =>
                    updateCardConfig({
                      trendDirection:
                        event.target.value as CardPanelConfig["trendDirection"],
                    })
                  }
                >
                  {TREND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.fieldItem}>
                <span className={styles.label}>变化率文案</span>
                <input
                  className={styles.input}
                  value={cardConfig.changeRate || ""}
                  onChange={handleTextChange("changeRate")}
                  placeholder="例如 +12.5%"
                />
              </label>
              <label className={styles.fieldItem}>
                <span className={styles.label}>变化值文案</span>
                <input
                  className={styles.input}
                  value={cardConfig.changeValue || ""}
                  onChange={handleTextChange("changeValue")}
                  placeholder="仅在没有字段值时兜底"
                />
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>趋势图样式</div>
              <p className={styles.sectionDescription}>
                配置线条颜色和平滑程度。
              </p>
            </div>
            <div className={styles.formGrid}>
              <label className={styles.fieldItem}>
                <span className={styles.label}>线条颜色</span>
                <input
                  className={styles.colorInput}
                  type="color"
                  value={cardConfig.chartColor || "#165dff"}
                  onChange={handleTextChange("chartColor")}
                />
              </label>
              <label className={styles.checkboxField}>
                <input
                  type="checkbox"
                  checked={cardConfig.chartSmooth ?? true}
                  onChange={(event) =>
                    updateCardConfig({
                      chartSmooth: event.target.checked,
                    })
                  }
                />
                <span className={styles.label}>使用平滑曲线</span>
              </label>
            </div>
          </section>
        </>
      ) : null}

      {variant === "withProgress" ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>进度配置</div>
            <p className={styles.sectionDescription}>
              目标值仅支持手填，其他文案和颜色可单独配置。
            </p>
          </div>
          <div className={styles.formGrid}>
            <label className={styles.fieldItem}>
              <span className={styles.label}>目标值</span>
              <input
                className={styles.input}
                type="number"
                value={cardConfig.progressTarget ?? ""}
                onChange={(event) =>
                  updateCardConfig({
                    progressTarget: toOptionalNumber(event.target.value),
                  })
                }
                placeholder="例如 100000"
              />
            </label>
            <label className={styles.fieldItem}>
              <span className={styles.label}>目标标签</span>
              <input
                className={styles.input}
                value={cardConfig.progressTargetLabel || ""}
                onChange={handleTextChange("progressTargetLabel")}
                placeholder="默认 Target"
              />
            </label>
            <label className={styles.fieldItem}>
              <span className={styles.label}>剩余标签</span>
              <input
                className={styles.input}
                value={cardConfig.progressRemainingLabel || ""}
                onChange={handleTextChange("progressRemainingLabel")}
                placeholder="默认 Remaining"
              />
            </label>
            <label className={styles.fieldItem}>
              <span className={styles.label}>进度颜色</span>
              <input
                className={styles.colorInput}
                type="color"
                value={cardConfig.progressColor || "#6366f1"}
                onChange={handleTextChange("progressColor")}
              />
            </label>
          </div>
        </section>
      ) : null}
    </div>
  );
};
