import type { ScopeOption } from "../types";

export const DEFAULT_ADD_PANEL_SCOPE_OPTIONS: ScopeOption[] = [
  { value: "active", label: "仅当前断点" },
  { value: "configured", label: "已配置断点" },
  { value: "all", label: "全部断点" },
];

export const getDefaultAddPanelDialogHint = (
  activeBreakpointLabel: string,
): string =>
  `当前正在编辑 ${activeBreakpointLabel}。选择“仅当前断点”时，不会再自动补到其它预设断点。`;
