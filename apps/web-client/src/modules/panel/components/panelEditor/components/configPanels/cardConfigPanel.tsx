import type { ChangeEvent } from "react";

import {
  METRIC_CARD_VARIANT_OPTIONS,
  type CardPanelConfig,
  type ConfigPanelProps,
  type MetricCardVariant,
} from "../../types";
import styles from "./cardConfigPanel.module.scss";

const DEFAULT_CARD_CONFIG: CardPanelConfig = {
  variant: "default",
  chartSmooth: true,
};

const TREND_OPTIONS = [
  { value: "none", label: "不展示趋势" },
  { value: "up", label: "上升" },
  { value: "down", label: "下降" },
] as const;

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

export const CardConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
}) => {
  const cardConfig = getCardConfig(config);
  const variant = cardConfig.variant ?? "default";

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

  return (
    <div className={styles.cardConfigPanel}>
      <section className={styles.section}>
        <div className={styles.sectionTitle}>卡片样式</div>
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
        <div className={styles.sectionTitle}>基础配置</div>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.label}>自定义标题</span>
            <input
              className={styles.input}
              value={cardConfig.title || ""}
              onChange={handleTextChange("title")}
              placeholder="为空时自动使用第一个指标名称"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>前缀</span>
            <input
              className={styles.input}
              value={cardConfig.prefix || ""}
              onChange={handleTextChange("prefix")}
              placeholder="例如 ￥、$"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>后缀</span>
            <input
              className={styles.input}
              value={cardConfig.suffix || ""}
              onChange={handleTextChange("suffix")}
              placeholder="例如 %、人、次"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>宽度</span>
            <input
              className={styles.input}
              value={cardConfig.width ? String(cardConfig.width) : ""}
              onChange={handleTextChange("width")}
              placeholder="例如 320 或 100%"
            />
          </label>
        </div>
      </section>

      {variant !== "withProgress" ? (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>趋势信息</div>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.label}>趋势方向</span>
              <select
                className={styles.select}
                value={cardConfig.trendDirection || "none"}
                onChange={(event) =>
                  updateCardConfig({
                    trendDirection: event.target.value as CardPanelConfig["trendDirection"],
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
            <label className={styles.field}>
              <span className={styles.label}>变化率</span>
              <input
                className={styles.input}
                value={cardConfig.changeRate || ""}
                onChange={handleTextChange("changeRate")}
                placeholder="例如 +12.5%"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>变化值</span>
              <input
                className={styles.input}
                value={cardConfig.changeValue || ""}
                onChange={handleTextChange("changeValue")}
                placeholder="例如 +912"
              />
            </label>
          </div>
        </section>
      ) : null}

      {variant === "withLineChart" ? (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>趋势线配置</div>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.label}>线条颜色</span>
              <input
                className={styles.colorInput}
                type="color"
                value={cardConfig.chartColor || "#165dff"}
                onChange={handleTextChange("chartColor")}
              />
            </label>
            <label className={`${styles.field} ${styles.checkboxField}`}>
              <input
                type="checkbox"
                checked={cardConfig.chartSmooth ?? true}
                onChange={(event) =>
                  updateCardConfig({
                    chartSmooth: event.target.checked,
                  })
                }
              />
              <span className={styles.label}>平滑曲线</span>
            </label>
          </div>
        </section>
      ) : null}

      {variant === "withProgress" ? (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>进度配置</div>
          <div className={styles.formGrid}>
            <label className={styles.field}>
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
            <label className={styles.field}>
              <span className={styles.label}>目标标签</span>
              <input
                className={styles.input}
                value={cardConfig.progressTargetLabel || ""}
                onChange={handleTextChange("progressTargetLabel")}
                placeholder="默认 Target"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>剩余标签</span>
              <input
                className={styles.input}
                value={cardConfig.progressRemainingLabel || ""}
                onChange={handleTextChange("progressRemainingLabel")}
                placeholder="默认 Remaining"
              />
            </label>
            <label className={styles.field}>
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
