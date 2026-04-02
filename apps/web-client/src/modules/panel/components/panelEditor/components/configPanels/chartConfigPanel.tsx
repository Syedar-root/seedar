import { FieldMapper } from "../fieldMapper/fieldMapper";
import { LabelConfigurator } from "../labelConfigurator/labelConfigurator";
import { LegendConfigurator } from "../legendConfigurator/legendConfigurator";
import { ColorPicker } from "../colorPicker/colorPicker";
import {
  CHART_FIELD_CONFIGS,
  DEFAULT_COLORS,
  DEFAULT_LEGENDS_CONFIG,
  type ConfigPanelProps,
  type ChartType,
} from "../../types";

export const ChartConfigPanel: React.FC<ConfigPanelProps> = ({
  fields,
  metrics,
  config,
  onChange,
}) => {
  const chartType = config.type as ChartType;
  const fieldConfig = chartType ? CHART_FIELD_CONFIGS[chartType] : null;

  return (
    <>
      {fieldConfig && (
        <FieldMapper
          fields={fields}
          metrics={metrics}
          config={config}
          fieldConfig={fieldConfig}
          onChange={onChange}
        />
      )}
      <LabelConfigurator
        config={config.label || { visible: false }}
        onChange={(label) => onChange({ label })}
      />
      <LegendConfigurator
        config={config.legends || DEFAULT_LEGENDS_CONFIG}
        onChange={(legends) => onChange({ legends })}
      />
      <ColorPicker
        colors={config.color || DEFAULT_COLORS}
        onChange={(colors) => onChange({ color: colors })}
      />
    </>
  );
};
