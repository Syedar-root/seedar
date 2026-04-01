import { useCallback } from "react";
import type { FormField, MetricConfig } from "../../../../types/editor.types";

export interface FieldItem {
  id: string | number;
  name: string;
  businessName?: string;
  type: "field";
}

export interface MetricItem {
  id: string | number;
  name: string;
  businessName?: string;
  type: "metric";
}

export interface FunctionItem {
  name: string;
  description: string;
  type: "function";
}

export type SuggestionItem = FieldItem | MetricItem | FunctionItem;

export const AGGREGATE_FUNCTIONS: FunctionItem[] = [
  { name: "SUM", description: "求和", type: "function" },
  { name: "COUNT", description: "计数", type: "function" },
  { name: "AVG", description: "平均值", type: "function" },
  { name: "MAX", description: "最大值", type: "function" },
  { name: "MIN", description: "最小值", type: "function" },
  { name: "DISTINCT_COUNT", description: "去重计数", type: "function" },
];

interface UseFormulaParserProps {
  fields: Array<{ id: string | number; name: string; businessName?: string }>;
  metrics: Array<{ id: string | number; name: string; businessName?: string }>;
}

export function useFormulaParser({ fields, metrics }: UseFormulaParserProps) {
  const fieldMap = new Map<string | number, any>();
  fields.forEach((f) => fieldMap.set(f.id, f));

  const metricMap = new Map<string | number, any>();
  metrics.forEach((m) => metricMap.set(m.id, m));

  const getFieldName = useCallback(
    (id: string | number): string => {
      const field = fieldMap.get(String(id));
      return field?.businessName || field?.name || `field_${id}`;
    },
    [fieldMap],
  );

  const getMetricName = useCallback(
    (id: string | number): string => {
      const metric = metricMap.get(id);
      return metric?.businessName || metric?.name || `metric_${id}`;
    },
    [metricMap],
  );

  const toDisplay = useCallback(
    (expression: string): string => {
      return expression
        .replace(/#M([^#\s+\-*/()]+)/g, (_, id) => {
          const numId = isNaN(Number(id)) ? id : Number(id);
          return getMetricName(numId);
        })
        .replace(/#F([^#\s+\-*/()]+)/g, (_, id) => {
          const numId = isNaN(Number(id)) ? id : Number(id);
          return getFieldName(numId);
        });
    },
    [getFieldName, getMetricName],
  );

  const toStorage = useCallback(
    (expression: string): string => {
      let result = expression;

      const sortedFields = [...fields].sort((a, b) => {
        const aLen = (a.businessName || a.name || "").length;
        const bLen = (b.businessName || b.name || "").length;
        return bLen - aLen;
      });

      const sortedMetrics = [...metrics].sort((a, b) => {
        const aLen = (a.businessName || a.name || "").length;
        const bLen = (b.businessName || b.name || "").length;
        return bLen - aLen;
      });

      sortedFields.forEach((field) => {
        const names = [field.businessName, field.name].filter(
          Boolean,
        ) as string[];
        names.forEach((name) => {
          if (name && result.includes(name)) {
            const regex = new RegExp(escapeRegex(name), "g");
            result = result.replace(regex, `#F${field.id}`);
          }
        });
      });

      sortedMetrics.forEach((metric) => {
        const names = [metric.businessName, metric.name].filter(
          Boolean,
        ) as string[];
        names.forEach((name) => {
          if (name && result.includes(name)) {
            const regex = new RegExp(escapeRegex(name), "g");
            result = result.replace(regex, `#M${metric.id}`);
          }
        });
      });

      return result;
    },
    [fields, metrics],
  );

  const getSuggestions = useCallback(
    (filter: string): SuggestionItem[] => {
      const items: SuggestionItem[] = [];
      const lowerFilter = filter.toLowerCase();

      AGGREGATE_FUNCTIONS.forEach((fn) => {
        if (fn.name.toLowerCase().includes(lowerFilter)) {
          items.push(fn);
        }
      });

      fields.forEach((field) => {
        const name = field.businessName || field.name;
        if (name?.toLowerCase().includes(lowerFilter)) {
          items.push({
            id: field.id,
            name,
            businessName: field.businessName,
            type: "field",
          });
        }
      });

      metrics.forEach((metric) => {
        const name = metric.businessName || metric.name;
        if (name?.toLowerCase().includes(lowerFilter)) {
          items.push({
            id: metric.id,
            name,
            businessName: metric.businessName,
            type: "metric",
          });
        }
      });

      return items;
    },
    [fields, metrics],
  );

  const detectSuggestionType = useCallback(
    (text: string): "function" | "field" | "metric" | null => {
      const lastWord = text.split(/[\s+\-*/()]+/).pop() || "";

      if (lastWord.startsWith("#F")) {
        return "field";
      }
      if (lastWord.startsWith("#M")) {
        return "metric";
      }

      const funcNames = AGGREGATE_FUNCTIONS.map((f) => f.name);
      if (
        funcNames.some((fn) =>
          fn.toLowerCase().startsWith(lastWord.toLowerCase()),
        )
      ) {
        return "function";
      }

      return null;
    },
    [],
  );

  const getSuggestionFilter = useCallback((text: string): string => {
    const lastWord = text.split(/[\s+\-*/()]+/).pop() || "";

    if (lastWord.startsWith("#F")) {
      return lastWord.slice(2);
    }
    if (lastWord.startsWith("#M")) {
      return lastWord.slice(2);
    }

    return lastWord;
  }, []);

  return {
    toDisplay,
    toStorage,
    getSuggestions,
    detectSuggestionType,
    getSuggestionFilter,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
