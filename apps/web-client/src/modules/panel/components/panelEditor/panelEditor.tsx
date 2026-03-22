import { useState, useEffect, useMemo } from "react";
import {
  DisplayPanelType,
  PanelEditorConfig,
  ChartType,
  CHART_FIELD_CONFIGS,
  DEFAULT_COLORS,
} from "./types";
import { TypeSelector } from "./components/typeSelector/typeSelector";
import { getConfigComponents } from "./configRegistry";
import styles from "./panelEditor.module.scss";
import type { DragItem } from "../dndHelper/dragZone/dragZone";

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

  return (
    <div className={styles.editor}>
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
    </div>
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
