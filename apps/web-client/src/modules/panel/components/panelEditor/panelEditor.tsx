import { useState, useEffect, useMemo, useRef } from "react";
import {
  DisplayPanelType,
  PanelEditorConfig,
  ChartType,
  CHART_FIELD_CONFIGS,
  DEFAULT_COLORS,
} from "./types";
import { TypeSelector } from "./components/typeSelector/typeSelector";
import { getConfigComponents } from "./configRegistry";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import type { DragItem } from "../dndHelper/dragZone/dragZone";
import styles from "./panelEditor.module.scss";

interface PanelEditorProps {
  fields: DragItem[];
  metrics: DragItem[];
  config?: PanelEditorConfig;
  displayType?: DisplayPanelType;
  onChange: (displayType: DisplayPanelType, config: PanelEditorConfig) => void;
}

export const PanelEditor: React.FC<PanelEditorProps> = ({
  fields,
  metrics,
  config,
  displayType = "table",
  onChange,
}) => {
  const [currentType, setCurrentType] = useState<DisplayPanelType>(displayType);
  const [currentConfig, setCurrentConfig] = useState<PanelEditorConfig>(
    config || { color: DEFAULT_COLORS },
  );
  const hasInitializedOptionsRef = useRef(false);

  useEffect(() => {
    setCurrentType(displayType);
    setCurrentConfig(config || { color: DEFAULT_COLORS });
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
      [...fields, ...metrics]
        .map((item) => item.businessName || item.name)
        .filter((value): value is string => Boolean(value)),
    );
  }, [fields, metrics]);

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

    const invalidPatch: Partial<PanelEditorConfig> = {};
    let hasInvalidValue = false;

    mappedKeys.forEach((key) => {
      const value = currentConfig[key];
      if (typeof value === "string" && value && !availableFieldValues.has(value)) {
        invalidPatch[key] = undefined;
        hasInvalidValue = true;
      }
    });

    if (!hasInvalidValue) {
      return;
    }

    const nextConfig = { ...currentConfig, ...invalidPatch };
    setCurrentConfig(nextConfig);
    onChange(currentType, nextConfig);
  }, [availableFieldValues, currentConfig, currentType, onChange]);

  return (
    <ScrollArea className={styles.editor}>
      <TypeSelector value={currentType} onChange={handleTypeChange} />

      {configComponents.map((Component, index) => (
        <Component
          key={index}
          fields={fields}
          metrics={metrics}
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
