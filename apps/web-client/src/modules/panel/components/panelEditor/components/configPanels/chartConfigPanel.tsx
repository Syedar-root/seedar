import { FieldMapper } from "../fieldMapper/fieldMapper";
import { LabelConfigurator } from "../labelConfigurator/labelConfigurator";
import { LegendConfigurator } from "../legendConfigurator/legendConfigurator";
import { ColorPicker } from "../colorPicker/colorPicker";
import {
  CHART_FIELD_CONFIGS,
  DEFAULT_COLORS,
  DEFAULT_LEGEND_CONFIG,
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
        config={config.legend || DEFAULT_LEGEND_CONFIG}
        onChange={(legend) => onChange({ legend })}
      />
      <ColorPicker
        colors={config.color || DEFAULT_COLORS}
        onChange={(colors) => onChange({ color: colors })}
      />
    </>
  );
};
