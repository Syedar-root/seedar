import { useState, useEffect, useMemo, useRef } from "react";
import {
  CARTESIAN_CHART_TYPES,
  DisplayPanelType,
  PanelEditorConfig,
  ChartType,
  CHART_FIELD_CONFIGS,
  DEFAULT_COLORS,
  DEFAULT_PANEL_FORMATTING_CONFIG,
} from "./types";
import { TypeSelector } from "./components/typeSelector/typeSelector";
import { getConfigComponents } from "./configRegistry";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import type { DragItem } from "../dndHelper/dragZone/dragZone";
import type { TempMetricConfig } from "../../types";
import styles from "./panelEditor.module.scss";

interface PanelEditorProps {
  fields: DragItem[];
  metrics: DragItem[];
  tempMetrics?: TempMetricConfig[];
  config?: PanelEditorConfig;
  displayType?: DisplayPanelType;
  onChange: (displayType: DisplayPanelType, config: PanelEditorConfig) => void;
}

export const PanelEditor: React.FC<PanelEditorProps> = ({
  fields,
  metrics,
  tempMetrics = [],
  config,
  displayType = "table",
  onChange,
}) => {
  const [currentType, setCurrentType] = useState<DisplayPanelType>(displayType);
  const [currentConfig, setCurrentConfig] = useState<PanelEditorConfig>(
    config || {
      color: DEFAULT_COLORS,
      formatting: DEFAULT_PANEL_FORMATTING_CONFIG,
    },
  );
  const hasInitializedOptionsRef = useRef(false);

  useEffect(() => {
    setCurrentType(displayType);
    setCurrentConfig(
      config || {
        color: DEFAULT_COLORS,
        formatting: DEFAULT_PANEL_FORMATTING_CONFIG,
      },
    );
  }, [displayType, config]);

  const handleTypeChange = (type: DisplayPanelType) => {
    setCurrentType(type);
    const newConfig = resetConfigForType(type, currentConfig);
    setCurrentConfig(newConfig);
    onChange(type, newConfig);
  };

  const handleConfigChange = (partialConfig: Partial<PanelEditorConfig>) => {
    const newConfig = { ...currentConfig, ...partialConfig };
    setCurrentConfig(newConfig);
    onChange(currentType, newConfig);
  };

  const configComponents = useMemo(
    () => getConfigComponents(currentType),
    [currentType],
  );

  const availableFieldValues = useMemo(() => {
    return new Set(
      [
        ...fields,
        ...metrics,
        ...tempMetrics.map((item) => ({
          id: item.id,
          name: item.alias,
          businessName: item.businessName,
        })),
      ]
        .map((item) => item.businessName || item.name)
        .filter((value): value is string => Boolean(value)),
    );
  }, [fields, metrics, tempMetrics]);

  useEffect(() => {
    if (!hasInitializedOptionsRef.current) {
      if (availableFieldValues.size === 0) {
        // 首次加载字段/指标尚未回填时，不要误清空已有配置
        return;
      }
      hasInitializedOptionsRef.current = true;
    }

    const mappedKeys: Array<keyof PanelEditorConfig> = [
      "xField",
      "yField",
      "seriesField",
      "categoryField",
      "valueField",
      "sizeField",
    ];
    const cardMappedKeys: Array<keyof NonNullable<PanelEditorConfig["card"]>> = [
      "valueField",
      "changeValueField",
      "chartXField",
      "chartYField",
    ];

    const invalidPatch: Partial<PanelEditorConfig> = {};
    let hasInvalidValue = false;

    mappedKeys.forEach((key) => {
      const value = currentConfig[key];
      if (
        typeof value === "string" &&
        value &&
        !availableFieldValues.has(value)
      ) {
        invalidPatch[key] = undefined;
        hasInvalidValue = true;
      }
    });

    const nextCardConfig = currentConfig.card ? { ...currentConfig.card } : undefined;
    let hasInvalidCardValue = false;

    cardMappedKeys.forEach((key) => {
      const value = currentConfig.card?.[key];
      if (
        typeof value === "string" &&
        value &&
        !availableFieldValues.has(value)
      ) {
        if (nextCardConfig) {
          nextCardConfig[key] = undefined;
        }
        hasInvalidCardValue = true;
      }
    });

    if (!hasInvalidValue && !hasInvalidCardValue) {
      return;
    }

    const nextConfig = {
      ...currentConfig,
      ...invalidPatch,
      ...(hasInvalidCardValue ? { card: nextCardConfig } : {}),
    };
    setCurrentConfig(nextConfig);
    // Use the controlled prop as the source of truth here; otherwise a stale
    // local currentType can overwrite a just-updated parent displayType.
    onChange(displayType, nextConfig);
  }, [availableFieldValues, currentConfig, displayType, onChange]);

  return (
    <ScrollArea className={styles.editor} contentStyle={{ minWidth: "none" }}>
      <TypeSelector value={currentType} onChange={handleTypeChange} />

      {configComponents.map((Component, index) => (
        <Component
          key={index}
          fields={fields}
          metrics={metrics}
          tempMetrics={tempMetrics}
          config={currentConfig}
          onChange={handleConfigChange}
        />
      ))}
    </ScrollArea>
  );
};

function resetConfigForType(
  type: DisplayPanelType,
  prevConfig: PanelEditorConfig,
): PanelEditorConfig {
  const baseConfig: PanelEditorConfig = {
    color: prevConfig.color || DEFAULT_COLORS,
    formatting: prevConfig.formatting || DEFAULT_PANEL_FORMATTING_CONFIG,
    card: prevConfig.card,
  };

  if (type === "table" || type === "card") {
    return baseConfig;
  }

  const fieldConfig = CHART_FIELD_CONFIGS[type as ChartType];
  if (!fieldConfig) return baseConfig;

  const newConfig: PanelEditorConfig = {
    ...baseConfig,
    type: type as ChartType,
  };

  if (prevConfig.axis && CARTESIAN_CHART_TYPES.includes(type as ChartType)) {
    newConfig.axis = prevConfig.axis;
  }

  if (type === "line" && typeof prevConfig.smooth === "boolean") {
    newConfig.smooth = prevConfig.smooth;
  }

  if (type === "bar" && prevConfig.direction) {
    newConfig.direction = prevConfig.direction;
  }

  fieldConfig.required.forEach((field) => {
    const key = field as keyof PanelEditorConfig;
    if (prevConfig[key]) {
      (newConfig as any)[field] = prevConfig[key];
    }
  });

  fieldConfig.optional.forEach((field) => {
    const key = field as keyof PanelEditorConfig;
    if (prevConfig[key]) {
      (newConfig as any)[field] = prevConfig[key];
    }
  });

  return newConfig;
}
