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
  const leftId =
    typeof leftTarget.id === "string" && leftTarget.id.trim()
      ? leftTarget.id.trim()
      : undefined;
  const rightId =
    typeof rightTarget.id === "string" && rightTarget.id.trim()
      ? rightTarget.id.trim()
      : undefined;

  if (
    leftRole !== rightRole ||
    leftTarget.kind !== rightTarget.kind
  ) {
    return false;
  }

  // 对于 field/metric 等稳定目标，优先使用 kind + id 判同。
  if (leftId && rightId) {
    return leftId === rightId;
  }

  // 若没有 id（例如 derived_dimension），再回退到 key。
  if (
    typeof leftTarget.key === "string" &&
    typeof rightTarget.key === "string"
  ) {
    return leftTarget.key === rightTarget.key;
  }

  // 最后才使用 datasetId 兜底。
  if (
    leftTarget.datasetId !== undefined &&
    rightTarget.datasetId !== undefined
  ) {
    return leftTarget.datasetId === rightTarget.datasetId;
  }

  return (
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
