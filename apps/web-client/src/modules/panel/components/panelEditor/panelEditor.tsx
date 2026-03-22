import { useState, useEffect, useMemo } from "react";
import {
  DisplayPanelType,
  PanelEditorConfig,
  ChartType,
  CHART_FIELD_CONFIGS,
  DEFAULT_COLORS,
} from "./types";
import { TypeSelector } from "./components/typeSelector/typeSelector";
import { FieldMapper } from "./components/fieldMapper/fieldMapper";
import { ColorPicker } from "./components/colorPicker/colorPicker";
import { LabelConfigurator } from "./components/labelConfigurator/labelConfigurator";
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
    config || { colors: DEFAULT_COLORS },
  );

  useEffect(() => {
    setCurrentType(displayType);
    setCurrentConfig(config || { colors: DEFAULT_COLORS });
  }, [displayType, config]);

  const handleTypeChange = (type: DisplayPanelType) => {
    setCurrentType(type);
    const newConfig = resetConfigForType(type, currentConfig);
    setCurrentConfig(newConfig);
    onChange(type, newConfig);
  };

  const handleConfigChange = (partialConfig: Partial<PanelEditorConfig>) => {
    const newConfig = { ...currentConfig, ...partialConfig };
    console.log("newconfig", newConfig);
    setCurrentConfig(newConfig);
    onChange(currentType, newConfig);
  };

  const fieldConfig = useMemo(() => {
    if (currentType === "table" || currentType === "card") return null;
    return CHART_FIELD_CONFIGS[currentType as ChartType] || null;
  }, [currentType]);

  return (
    <div className={styles.editor}>
      <TypeSelector value={currentType} onChange={handleTypeChange} />

      {fieldConfig && (
        <FieldMapper
          fields={fields}
          metrics={metrics}
          config={currentConfig}
          fieldConfig={fieldConfig}
          onChange={handleConfigChange}
        />
      )}

      {currentType !== "table" && currentType !== "card" && (
        <>
          <LabelConfigurator
            config={currentConfig.label || { visible: false }}
            onChange={(label) => handleConfigChange({ label })}
          />
          <ColorPicker
            colors={currentConfig.colors || DEFAULT_COLORS}
            onChange={(colors) => handleConfigChange({ colors })}
          />
        </>
      )}
    </div>
  );
};

function resetConfigForType(
  type: DisplayPanelType,
  prevConfig: PanelEditorConfig,
): PanelEditorConfig {
  const baseConfig: PanelEditorConfig = {
    colors: prevConfig.colors || DEFAULT_COLORS,
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
