import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Sender } from "@ant-design/x";
import type { GetRef } from "antd";
import type { SlotConfigType } from "@ant-design/x/es/sender/interface";
import { Search } from "lucide-react";
import {
  useFormulaParser,
  SuggestionItem,
  AGGREGATE_FUNCTIONS,
  FunctionItem,
  FieldItem,
  MetricItem,
} from "./useFormulaParser";
import { FormulaSuggestion } from "./FormulaSuggestion";
import { ScrollArea } from "@/core/components/ui/ScrollArea/ScrollArea";
import styles from "./FormulaEditor.module.scss";

const FORMULA_TOKEN_PATTERN = /#([FM])([^#\s+\-*/()]+)/g;
const FORMULA_PLACEHOLDER = "输入公式，例如：SUM(amount) * price";

interface FormulaEditorProps {
  fields: Array<{
    id: string | number;
    name: string;
    businessName?: string;
    tableName?: string;
  }>;
  metrics: Array<{ id: string | number; name: string; businessName?: string }>;
  value: string;
  onChange: (value: string) => void;
}

const createFieldSuggestion = (
  field: FormulaEditorProps["fields"][number],
): FieldItem => ({
  id: field.id,
  name: field.businessName || field.name,
  businessName: field.businessName,
  tableName: field.tableName,
  type: "field",
});

const createMetricSuggestion = (
  metric: FormulaEditorProps["metrics"][number],
): MetricItem => ({
  id: metric.id,
  name: metric.businessName || metric.name,
  businessName: metric.businessName,
  type: "metric",
});

const createTokenSlot = (
  item: FieldItem | MetricItem,
  prefix: "F" | "M",
  uniqueSuffix: string,
): SlotConfigType => ({
  type: "tag",
  key: `${item.type}-${item.id}-${uniqueSuffix}`,
  props: {
    label: item.name,
    value: `#${prefix}${item.id}`,
  },
  formatResult: (slotValue: string) =>
    String(slotValue || `#${prefix}${item.id}`),
});

const buildFormulaSlotConfig = (
  expression: string,
  fields: FormulaEditorProps["fields"],
  metrics: FormulaEditorProps["metrics"],
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
          createTokenSlot(createFieldSuggestion(sourceItem), "F", `${offset}`),
        );
      } else {
        slotConfig.push(
          createTokenSlot(createMetricSuggestion(sourceItem), "M", `${offset}`),
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

const getTextBeforeCursor = (element: HTMLElement): string => {
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

export const FormulaEditor: React.FC<FormulaEditorProps> = ({
  fields,
  metrics,
  value,
  onChange,
}) => {
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [activeTab, setActiveTab] = useState<"function" | "field" | "metric">(
    "function",
  );
  const [sidebarSearchKeyword, setSidebarSearchKeyword] = useState("");
  const [senderSlotConfig, setSenderSlotConfig] = useState<SlotConfigType[]>(() =>
    buildFormulaSlotConfig(value, fields, metrics),
  );
  const [senderInstanceKey, setSenderInstanceKey] = useState(0);
  const inputRef = useRef<GetRef<typeof Sender>>(null);
  const lastStorageValueRef = useRef(value);
  const lastLabelSignatureRef = useRef("");

  const { toStorage, detectSuggestionType, getSuggestionFilter } =
    useFormulaParser({
      fields,
      metrics,
    });

  const normalizedSidebarSearchKeyword = sidebarSearchKeyword
    .trim()
    .toLowerCase();
  const labelSignature = useMemo(
    () =>
      JSON.stringify({
        fields: fields.map((field) => ({
          id: field.id,
          name: field.name,
          businessName: field.businessName,
          tableName: field.tableName,
        })),
        metrics: metrics.map((metric) => ({
          id: metric.id,
          name: metric.name,
          businessName: metric.businessName,
        })),
      }),
    [fields, metrics],
  );

  const filteredFunctions = useMemo(
    () =>
      !normalizedSidebarSearchKeyword
        ? AGGREGATE_FUNCTIONS
        : AGGREGATE_FUNCTIONS.filter((fn) =>
            fn.name.toLowerCase().includes(normalizedSidebarSearchKeyword),
          ),
    [normalizedSidebarSearchKeyword],
  );

  const filteredFields = useMemo(
    () =>
      !normalizedSidebarSearchKeyword
        ? fields
        : fields.filter((field) => {
            const fieldName = (field.businessName || field.name).toLowerCase();
            const tableName = field.tableName?.toLowerCase() || "";

            return (
              fieldName.includes(normalizedSidebarSearchKeyword) ||
              tableName.includes(normalizedSidebarSearchKeyword)
            );
          }),
    [fields, normalizedSidebarSearchKeyword],
  );

  const filteredMetrics = useMemo(
    () =>
      !normalizedSidebarSearchKeyword
        ? metrics
        : metrics.filter((metric) =>
            (metric.businessName || metric.name)
              .toLowerCase()
              .includes(normalizedSidebarSearchKeyword),
          ),
    [metrics, normalizedSidebarSearchKeyword],
  );

  const syncSuggestionsFromCursor = useCallback(() => {
    const anchorElement = inputRef.current?.inputElement as HTMLElement | null;
    if (!anchorElement) {
      setSuggestions([]);
      setShowSuggestion(false);
      return;
    }

    const textBeforeCursor = getTextBeforeCursor(anchorElement);
    const lastWord = textBeforeCursor.split(/[\s+\-*/()]+/).pop() || "";
    const suggestionType = detectSuggestionType(lastWord);
    const filter = getSuggestionFilter(lastWord);

    if (!lastWord) {
      setSuggestions([]);
      setShowSuggestion(false);
      return;
    }

    if (lastWord.startsWith("#F")) {
      setSuggestions(
        fields
          .filter((field) => {
            const name = field.businessName || field.name;
            return name?.toLowerCase().includes(filter.toLowerCase());
          })
          .map(createFieldSuggestion),
      );
      setShowSuggestion(true);
      return;
    }

    if (lastWord.startsWith("#M")) {
      setSuggestions(
        metrics
          .filter((metric) => {
            const name = metric.businessName || metric.name;
            return name?.toLowerCase().includes(filter.toLowerCase());
          })
          .map(createMetricSuggestion),
      );
      setShowSuggestion(true);
      return;
    }

    if (suggestionType === "function") {
      setSuggestions(
        AGGREGATE_FUNCTIONS.filter((fn) =>
          fn.name.toLowerCase().includes(filter.toLowerCase()),
        ),
      );
      setShowSuggestion(true);
      return;
    }

    setSuggestions([]);
    setShowSuggestion(false);
  }, [detectSuggestionType, fields, getSuggestionFilter, metrics]);

  useEffect(() => {
    const shouldResync =
      value !== lastStorageValueRef.current ||
      labelSignature !== lastLabelSignatureRef.current;

    if (!shouldResync) {
      return;
    }

    setSenderSlotConfig(buildFormulaSlotConfig(value, fields, metrics));
    setSenderInstanceKey((previousKey) => previousKey + 1);
    lastStorageValueRef.current = value;
    lastLabelSignatureRef.current = labelSignature;
  }, [fields, labelSignature, metrics, value]);

  const handleSenderChange = useCallback(
    (nextValue: string) => {
      const storageValue = toStorage(nextValue);
      lastStorageValueRef.current = storageValue;
      onChange(storageValue);

      requestAnimationFrame(() => {
        syncSuggestionsFromCursor();
      });
    },
    [onChange, syncSuggestionsFromCursor, toStorage],
  );

  const insertSuggestionItem = useCallback(
    (item: SuggestionItem, replaceCharacters?: string) => {
      if (!inputRef.current) {
        return;
      }

      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const insertConfig: SlotConfigType[] =
        item.type === "function"
          ? [{ type: "text", value: `${(item as FunctionItem).name}()` }]
          : item.type === "field"
            ? [createTokenSlot(item as FieldItem, "F", uniqueSuffix)]
            : [createTokenSlot(item as MetricItem, "M", uniqueSuffix)];

      inputRef.current.insert?.(insertConfig, "cursor", replaceCharacters);
      setShowSuggestion(false);

      requestAnimationFrame(() => {
        inputRef.current?.focus?.();
        syncSuggestionsFromCursor();
      });
    },
    [syncSuggestionsFromCursor],
  );

  const handleSuggestionSelect = useCallback(
    (item: SuggestionItem) => {
      const anchorElement = inputRef.current?.inputElement as HTMLElement | null;
      const textBeforeCursor = anchorElement
        ? getTextBeforeCursor(anchorElement)
        : "";
      const lastWord = textBeforeCursor.split(/[\s+\-*/()]+/).pop() || "";

      insertSuggestionItem(item, lastWord || undefined);
    },
    [insertSuggestionItem],
  );

  const handleClickInsert = useCallback(
    (item: SuggestionItem) => {
      insertSuggestionItem(item);
    },
    [insertSuggestionItem],
  );

  return (
    <div className={styles.container}>
      <div className={styles.editorSection}>
        <div className={styles.editorWrapper}>
          <Sender
            key={senderInstanceKey}
            ref={inputRef}
            classNames={{
              root: styles.sender,
              input: styles.senderInput,
            }}
            autoSize={{ minRows: 6, maxRows: 10 }}
            suffix={false}
            slotConfig={senderSlotConfig}
            placeholder={FORMULA_PLACEHOLDER}
            onChange={handleSenderChange}
            onFocus={() => {
              requestAnimationFrame(() => {
                syncSuggestionsFromCursor();
              });
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !showSuggestion) {
                return false;
              }
            }}
          />
          {showSuggestion && (
            <FormulaSuggestion
              items={suggestions}
              onSelect={handleSuggestionSelect}
              anchorElement={
                (inputRef.current?.inputElement as HTMLElement | null) || null
              }
              onClose={() => setShowSuggestion(false)}
            />
          )}
        </div>
      </div>

      <div className={styles.sidebar}>
        <div className={styles.tabHeader}>
          <button
            className={`${styles.tabButton} ${activeTab === "function" ? styles.active : ""}`}
            onClick={() => setActiveTab("function")}
          >
            函数
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "field" ? styles.active : ""}`}
            onClick={() => setActiveTab("field")}
          >
            字段
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "metric" ? styles.active : ""}`}
            onClick={() => setActiveTab("metric")}
          >
            指标
          </button>
        </div>

        <div className={styles.tabContent}>
          <div className={styles.searchBox}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              value={sidebarSearchKeyword}
              onChange={(event) => setSidebarSearchKeyword(event.target.value)}
              placeholder={
                activeTab === "function"
                  ? "搜索函数"
                  : activeTab === "field"
                    ? "搜索字段"
                    : "搜索指标"
              }
              aria-label={
                activeTab === "function"
                  ? "搜索函数"
                  : activeTab === "field"
                    ? "搜索字段"
                    : "搜索指标"
              }
            />
          </div>
          <ScrollArea style={{ maxHeight: "200px" }}>
            {activeTab === "function" && (
              <div className={styles.itemList}>
                {filteredFunctions.map((fn) => (
                  <button
                    key={fn.name}
                    className={styles.itemButton}
                    onClick={() => handleClickInsert(fn)}
                  >
                    <span className={styles.functionBadge}>fn</span>
                    <span className={styles.itemName}>{fn.name}</span>
                  </button>
                ))}
                {filteredFunctions.length === 0 && (
                  <div className={styles.emptyState}>暂无匹配的函数</div>
                )}
              </div>
            )}

            {activeTab === "field" && (
              <div className={styles.itemList}>
                {filteredFields.map((field) => (
                  <button
                    key={field.id}
                    className={styles.itemButton}
                    onClick={() => handleClickInsert(createFieldSuggestion(field))}
                  >
                    <span className={styles.fieldBadge}>F</span>
                    <span className={styles.itemName}>
                      {field.businessName || field.name}
                    </span>
                    {field.tableName && (
                      <span className={styles.tableTag}>{field.tableName}</span>
                    )}
                  </button>
                ))}
                {filteredFields.length === 0 && (
                  <div className={styles.emptyState}>暂无匹配的字段</div>
                )}
              </div>
            )}

            {activeTab === "metric" && (
              <div className={styles.itemList}>
                {filteredMetrics.map((metric) => (
                  <button
                    key={metric.id}
                    className={styles.itemButton}
                    onClick={() => handleClickInsert(createMetricSuggestion(metric))}
                  >
                    <span className={styles.metricBadge}>M</span>
                    <span className={styles.itemName}>
                      {metric.businessName || metric.name}
                    </span>
                  </button>
                ))}
                {filteredMetrics.length === 0 && (
                  <div className={styles.emptyState}>暂无匹配的指标</div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
