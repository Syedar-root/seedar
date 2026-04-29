import type { ReactNode } from "react";
import type { SlotConfigType } from "@ant-design/x/es/sender/interface";
import { FieldItem, MetricItem } from "../useFormulaParser";

type FormulaField = {
  id: string | number;
  name: string;
  businessName?: string;
  tableName?: string;
};

type FormulaMetric = {
  id: string | number;
  name: string;
  businessName?: string;
};

export const FORMULA_TOKEN_PATTERN = /#([FM])(\d+)/g;

export const createFieldSuggestion = (field: FormulaField): FieldItem => ({
  id: field.id,
  name: field.name,
  businessName: field.businessName,
  tableName: field.tableName,
  type: "field",
});

export const createMetricSuggestion = (metric: FormulaMetric): MetricItem => ({
  id: metric.id,
  name: metric.name,
  businessName: metric.businessName,
  type: "metric",
});

export const getFieldSourceLabel = (
  field: Pick<FormulaField, "tableName" | "name">,
): string | null => {
  if (!field.tableName) {
    return null;
  }

  return `${field.tableName}.${field.name}`;
};

type TokenLabelRenderer = (item: FieldItem | MetricItem) => ReactNode;

const createTokenSlot = (
  item: FieldItem | MetricItem,
  prefix: "F" | "M",
  uniqueSuffix: string,
  renderTokenLabel?: TokenLabelRenderer,
): SlotConfigType => ({
  type: "tag",
  key: `${item.type}-${item.id}-${uniqueSuffix}`,
  props: {
    label: renderTokenLabel
      ? renderTokenLabel(item)
      : item.businessName || item.name,
    value: `#${prefix}${item.id}`,
  },
  formatResult: (slotValue: string) =>
    String(slotValue || `#${prefix}${item.id}`),
});

export const buildFormulaSlotConfig = (
  expression: string,
  fields: FormulaField[],
  metrics: FormulaMetric[],
  renderTokenLabel?: TokenLabelRenderer,
): SlotConfigType[] => {
  if (!expression) {
    return [];
  }

  const fieldMap = new Map(fields.map((field) => [String(field.id), field]));
  const metricMap = new Map(metrics.map((metric) => [String(metric.id), metric]));
  const slotConfig: SlotConfigType[] = [];
  let lastIndex = 0;

  expression.replace(
    FORMULA_TOKEN_PATTERN,
    (matched, tokenType: "F" | "M", tokenId: string, offset: number) => {
      if (offset > lastIndex) {
        slotConfig.push({
          type: "text",
          value: expression.slice(lastIndex, offset),
        });
      }

      const sourceItem =
        tokenType === "F" ? fieldMap.get(tokenId) : metricMap.get(tokenId);

      if (!sourceItem) {
        slotConfig.push({ type: "text", value: matched });
      } else if (tokenType === "F") {
        slotConfig.push(
          createTokenSlot(
            createFieldSuggestion(sourceItem),
            "F",
            `${offset}`,
            renderTokenLabel,
          ),
        );
      } else {
        slotConfig.push(
          createTokenSlot(
            createMetricSuggestion(sourceItem),
            "M",
            `${offset}`,
            renderTokenLabel,
          ),
        );
      }

      lastIndex = offset + matched.length;
      return matched;
    },
  );

  if (lastIndex < expression.length) {
    slotConfig.push({
      type: "text",
      value: expression.slice(lastIndex),
    });
  }

  return slotConfig;
};

export const getTextBeforeCursor = (element: HTMLElement): string => {
  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    return element.value.slice(0, element.selectionStart ?? element.value.length);
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return element.textContent || "";
  }

  const range = selection.getRangeAt(0);
  if (!element.contains(range.endContainer)) {
    return element.textContent || "";
  }

  const clonedRange = range.cloneRange();
  clonedRange.selectNodeContents(element);
  clonedRange.setEnd(range.endContainer, range.endOffset);
  return clonedRange.toString();
};
