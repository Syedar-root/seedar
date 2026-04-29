import { useState, useCallback, useRef, useMemo } from "react";
import { Sender } from "@ant-design/x";
import type { GetRef } from "antd";
import type { SlotConfigType } from "@ant-design/x/es/sender/interface";
import { Search } from "lucide-react";
import {
  useFormulaParser,
  SuggestionItem,
  AGGREGATE_FUNCTIONS,
  FunctionItem,
} from "../../useFormulaParser";
import { FormulaSuggestion } from "../FormulaSuggestion";
import { ScrollArea } from "@/core/components/ui/ScrollArea/ScrollArea";
import styles from "./FormulaEditor.module.scss";
import {
  buildFormulaSlotConfig,
  createFieldSuggestion,
  createMetricSuggestion,
  getFieldSourceLabel,
  getTextBeforeCursor,
} from "../../utils/formulaEditor.utils";

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
  const [senderSlotConfig] = useState<SlotConfigType[]>(() =>
    buildFormulaSlotConfig(value, fields, metrics),
  );
  const inputRef = useRef<GetRef<typeof Sender>>(null);

  const { toStorage, detectSuggestionType, getSuggestionFilter } =
    useFormulaParser({
      fields,
      metrics,
    });

  const normalizedSidebarSearchKeyword = sidebarSearchKeyword
    .trim()
    .toLowerCase();
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
            const displayName = field.businessName || field.name;
            return displayName?.toLowerCase().includes(filter.toLowerCase());
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
            const displayName = metric.businessName || metric.name;
            return displayName?.toLowerCase().includes(filter.toLowerCase());
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

  const handleSenderChange = useCallback(
    (nextValue: string) => {
      const storageValue = toStorage(nextValue);
      if (storageValue === value) {
        return;
      }

      onChange(storageValue);

      requestAnimationFrame(() => {
        syncSuggestionsFromCursor();
      });
    },
    [onChange, syncSuggestionsFromCursor, toStorage, value],
  );

  const insertSuggestionItem = useCallback(
    (item: SuggestionItem, replaceCharacters?: string) => {
      if (!inputRef.current) {
        return;
      }

      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      let insertConfig: SlotConfigType[];

      if (item.type === "function") {
        insertConfig = [{ type: "text", value: `${(item as FunctionItem).name}()` }];
      } else if (item.type === "field") {
        const fieldItem = item;
        insertConfig = [
          {
            type: "tag",
            key: `${fieldItem.type}-${fieldItem.id}-${uniqueSuffix}`,
            props: {
              label: fieldItem.businessName || fieldItem.name,
              value: `#F${fieldItem.id}`,
            },
            formatResult: (slotValue: string) =>
              String(slotValue || `#F${fieldItem.id}`),
          },
        ];
      } else {
        const metricItem = item;
        insertConfig = [
          {
            type: "tag",
            key: `${metricItem.type}-${metricItem.id}-${uniqueSuffix}`,
            props: {
              label: metricItem.businessName || metricItem.name,
              value: `#M${metricItem.id}`,
            },
            formatResult: (slotValue: string) =>
              String(slotValue || `#M${metricItem.id}`),
          },
        ];
      }

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
                    <span className={styles.itemName} title={fn.name}>
                      {fn.name}
                    </span>
                  </button>
                ))}
                {filteredFunctions.length === 0 && (
                  <div className={styles.emptyState}>暂无匹配的函数</div>
                )}
              </div>
            )}

            {activeTab === "field" && (
              <div className={styles.itemList}>
                {filteredFields.map((field) => {
                  const sourceLabel = getFieldSourceLabel(field);
                  const displayName = field.businessName || field.name;

                  return (
                    <button
                      key={field.id}
                      className={styles.itemButton}
                      onClick={() => handleClickInsert(createFieldSuggestion(field))}
                    >
                      <span className={styles.fieldBadge}>F</span>
                      <span className={styles.itemName} title={displayName}>
                        {displayName}
                      </span>
                      {sourceLabel ? (
                        <span className={styles.tableTag} title={sourceLabel}>
                          {sourceLabel}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
                {filteredFields.length === 0 && (
                  <div className={styles.emptyState}>暂无匹配的字段</div>
                )}
              </div>
            )}

            {activeTab === "metric" && (
              <div className={styles.itemList}>
                {filteredMetrics.map((metric) => {
                  const displayName = metric.businessName || metric.name;

                  return (
                    <button
                      key={metric.id}
                      className={styles.itemButton}
                      onClick={() => handleClickInsert(createMetricSuggestion(metric))}
                    >
                      <span className={styles.metricBadge}>M</span>
                      <span className={styles.itemName} title={displayName}>
                        {displayName}
                      </span>
                    </button>
                  );
                })}
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
