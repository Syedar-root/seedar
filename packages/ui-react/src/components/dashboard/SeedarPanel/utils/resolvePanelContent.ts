import type { PanelFormattingConfig, PanelResponse } from "#pkg/seedar/types";
import type { ISpec } from "@visactor/vchart";
import type { MetricCardPanelConfig } from "../../../data-display/MetricCard";

import type { PanelContentDescriptor } from "../types";

const getPanelFormatting = (
  config: PanelResponse["config"],
): PanelFormattingConfig | undefined =>
  (config as { formatting?: PanelFormattingConfig } | undefined)?.formatting;

const getCardConfig = (
  config: PanelResponse["config"],
): MetricCardPanelConfig | undefined =>
  (config as { card?: MetricCardPanelConfig } | undefined)?.card;

export const resolvePanelContent = (
  panel?: PanelResponse,
): PanelContentDescriptor => {
  if (!panel) {
    return { kind: "empty" };
  }

  const { config, queryId, type } = panel;

  if (type === "chart" && config) {
    return {
      kind: "chart",
      queryId,
      spec: config as ISpec,
    };
  }

  if (type === "table") {
    return {
      kind: "table",
      queryId,
      formatting: getPanelFormatting(config),
    };
  }

  if (type === "card") {
    return {
      kind: "card",
      queryId,
      formatting: getPanelFormatting(config),
      config: getCardConfig(config),
    };
  }

  if (type === "text") {
    return {
      kind: "text",
      content: config?.content,
    };
  }

  return { kind: "empty" };
};
