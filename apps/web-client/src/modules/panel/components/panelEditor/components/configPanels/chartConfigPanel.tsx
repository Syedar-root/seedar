import { FieldMapper } from "../fieldMapper/fieldMapper";
import { LabelConfigurator } from "../labelConfigurator/labelConfigurator";
import { LegendConfigurator } from "../legendConfigurator/legendConfigurator";
import { ColorPicker } from "../colorPicker/colorPicker";
import { AxisConfigurator } from "../axisConfigurator/axisConfigurator";
import {
  CARTESIAN_CHART_TYPES,
  CHART_FIELD_CONFIGS,
  DEFAULT_COLORS,
  DEFAULT_LEGENDS_CONFIG,
  createDefaultAxisConfig,
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
  const showAxisConfigurator = chartType
    ? CARTESIAN_CHART_TYPES.includes(chartType)
    : false;

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
      {showAxisConfigurator && (
        <AxisConfigurator
          config={config.axis || createDefaultAxisConfig()}
          onChange={(axis) => onChange({ axis })}
        />
      )}
      <ColorPicker
        colors={config.color || DEFAULT_COLORS}
        onChange={(colors) => onChange({ color: colors })}
      />
    </>
  );
};
