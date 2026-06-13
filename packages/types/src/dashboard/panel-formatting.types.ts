export type PanelFormattingSurface =
  | 'table_cell'
  | 'table_header'
  | 'axis_x'
  | 'axis_y'
  | 'tooltip'
  | 'data_label'
  | 'legend'
  | 'card_value'
  | 'card_subvalue';

export type PanelFormattingRole = 'dimension' | 'metric';

export type PanelFormattingTargetKind =
  | 'field'
  | 'metric'
  | 'derived_dimension'
  | 'temp_metric'
  | 'unknown';

export interface PanelFormattingTarget {
  kind: PanelFormattingTargetKind;
  datasetId?: number;
  id?: string;
  key?: string;
}

export interface PanelFormattingLocaleOption {
  mode: 'browser' | 'fixed';
  value: string | null;
}

export type PanelSimpleFormatKind =
  | 'number'
  | 'percent'
  | 'currency'
  | 'date'
  | 'datetime';

export interface PanelSimpleFormattingRule {
  id: string;
  target: PanelFormattingTarget;
  role: PanelFormattingRole;
  enabled?: boolean;
  kind: PanelSimpleFormatKind;
  decimals?: number;
  useGrouping?: boolean;
  currency?: string;
  percentInput?: 'ratio' | 'percent';
  /** 显示时乘以该系数。例如数据以"分"存储时设为 0.01 即可显示为"元"。不影响原始数据，仅在展示层生效。 */
  multiplier?: number;
}

export interface PanelSimpleFormattingConfig {
  version: 3;
  nullText: string;
  locale: PanelFormattingLocaleOption;
  timeZone: PanelFormattingLocaleOption;
  rules: PanelSimpleFormattingRule[];
}

export type PanelFormattingConfig = PanelSimpleFormattingConfig;
