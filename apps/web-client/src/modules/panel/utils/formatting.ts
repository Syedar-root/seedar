import type {
  PanelFormattingConfig,
  PanelFormattingRole,
  PanelFormattingTarget,
  PanelSimpleFormattingConfig,
  PanelSimpleFormattingRule,
} from "#pkg/seedar/types";

const DEFAULT_SIMPLE_FORMATTING_CONFIG: PanelSimpleFormattingConfig = {
  version: 3,
  nullText: "--",
  locale: { mode: "browser", value: null },
  timeZone: { mode: "browser", value: null },
  rules: [],
};

export const toSimpleFormattingConfig = (
  formatting?: PanelFormattingConfig,
): PanelSimpleFormattingConfig => {
  if (formatting?.version === 3) {
    return JSON.parse(JSON.stringify(formatting)) as PanelSimpleFormattingConfig;
  }

  return JSON.parse(
    JSON.stringify(DEFAULT_SIMPLE_FORMATTING_CONFIG),
  ) as PanelSimpleFormattingConfig;
};

export const isSameFormattingTarget = (
  leftTarget: PanelFormattingTarget,
  leftRole: PanelFormattingRole,
  rightTarget: PanelFormattingTarget,
  rightRole: PanelFormattingRole,
) => {
  return (
    leftRole === rightRole &&
    leftTarget.kind === rightTarget.kind &&
    leftTarget.id === rightTarget.id &&
    leftTarget.key === rightTarget.key &&
    leftTarget.datasetId === rightTarget.datasetId
  );
};

export const findSimpleFormattingRule = (
  formatting: PanelSimpleFormattingConfig,
  target: PanelFormattingTarget,
  role: PanelFormattingRole,
): PanelSimpleFormattingRule | undefined => {
  return formatting.rules.find((rule) =>
    isSameFormattingTarget(rule.target, rule.role, target, role),
  );
};
