import { useEffect, useState } from "react";
import clsx from "clsx";
import { DisplayPanelType } from "../../types";
import styles from "./typeSelector.module.scss";

interface TypeSelectorProps {
  value: DisplayPanelType;
  onChange: (type: DisplayPanelType) => void;
}

type PrimaryType = "chart" | "table" | "card";

interface PrimaryTypeOption {
  type: PrimaryType;
  label: string;
  description: string;
}

interface ChartPresetOption {
  type: Exclude<DisplayPanelType, "table" | "card">;
  label: string;
}

const PRIMARY_TYPE_OPTIONS: PrimaryTypeOption[] = [
  {
    type: "chart",
    label: "图表",
    description: "按图形方式展示数据",
  },
  {
    type: "table",
    label: "表格",
    description: "适合查看完整明细",
  },
  {
    type: "card",
    label: "卡片",
    description: "适合重点指标概览",
  },
];

const CHART_PRESET_OPTIONS: ChartPresetOption[] = [
  { type: "line", label: "折线图" },
  { type: "bar", label: "柱状图" },
  { type: "area", label: "面积图" },
  { type: "pie", label: "饼图" },
  { type: "scatter", label: "散点图" },
  { type: "radar", label: "雷达图" },
];

const DEFAULT_CHART_TYPE: ChartPresetOption["type"] = "line";

const isChartType = (
  type: DisplayPanelType,
): type is ChartPresetOption["type"] => {
  return type !== "table" && type !== "card";
};

const getPrimaryType = (type: DisplayPanelType): PrimaryType => {
  if (type === "table" || type === "card") {
    return type;
  }

  return "chart";
};

export const TypeSelector: React.FC<TypeSelectorProps> = ({ value, onChange }) => {
  const [lastChartType, setLastChartType] =
    useState<ChartPresetOption["type"]>(DEFAULT_CHART_TYPE);

  const activePrimaryType = getPrimaryType(value);
  const activeChartType = isChartType(value) ? value : lastChartType;

  useEffect(() => {
    if (isChartType(value)) {
      setLastChartType(value);
    }
  }, [value]);

  const handlePrimaryTypeClick = (type: PrimaryType) => {
    if (type === "chart") {
      if (!isChartType(value)) {
        onChange(lastChartType);
      }

      return;
    }

    if (value !== type) {
      onChange(type);
    }
  };

  return (
    <div className={styles.typeSelector}>
      <div className={styles.section}>
        <div className={styles.title}>展示类型</div>
        <div className={styles.primaryGrid}>
          {PRIMARY_TYPE_OPTIONS.map((item) => {
            const isActive = activePrimaryType === item.type;

            return (
              <button
                key={item.type}
                type="button"
                className={clsx(styles.primaryItem, isActive && styles.active)}
                onClick={() => handlePrimaryTypeClick(item.type)}
              >
                <span className={styles.primaryLabel}>{item.label}</span>
                <span className={styles.primaryDescription}>
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activePrimaryType === "chart" && (
        <div className={styles.section}>
          <div className={styles.subTitle}>预设图表类型</div>
          <div className={styles.chartPresetGrid}>
            {CHART_PRESET_OPTIONS.map((item) => (
              <button
                key={item.type}
                type="button"
                className={clsx(
                  styles.chartPresetItem,
                  activeChartType === item.type && styles.active,
                )}
                onClick={() => onChange(item.type)}
              >
                <span className={styles.chartPresetLabel}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
