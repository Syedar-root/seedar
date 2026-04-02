import type { DisplayPanelType, ConfigPanelProps } from "./types";
import {
  ChartConfigPanel,
  TableConfigPanel,
  CardConfigPanel,
  PieSpecialConfig,
  ScatterSpecialConfig,
  RadarSpecialConfig,
} from "./components/configPanels";

type ConfigComponent = React.FC<ConfigPanelProps>;

interface PanelConfig {
  components: ConfigComponent[];
}

const PANEL_CONFIG_REGISTRY: Record<DisplayPanelType, PanelConfig> = {
  table: { components: [TableConfigPanel] },
  card: { components: [CardConfigPanel] },
  line: { components: [ChartConfigPanel] },
  bar: { components: [ChartConfigPanel] },
  area: { components: [ChartConfigPanel] },
  pie: { components: [ChartConfigPanel, PieSpecialConfig] },
  scatter: { components: [ChartConfigPanel, ScatterSpecialConfig] },
  radar: { components: [ChartConfigPanel, RadarSpecialConfig] },
};

export function getConfigComponents(type: DisplayPanelType): ConfigComponent[] {
  return PANEL_CONFIG_REGISTRY[type]?.components || [];
}
