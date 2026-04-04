import { useState, useCallback, useRef, useEffect } from "react";
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
  const [suggestionFilter, setSuggestionFilter] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [activeTab, setActiveTab] = useState<"function" | "field" | "metric">(
    "function",
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { toDisplay, toStorage, detectSuggestionType, getSuggestionFilter } =
    useFormulaParser({
      fields,
      metrics,
    });

  const displayValue = toDisplay(value);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const inputValue = e.target.value;
      const storageValue = toStorage(inputValue);
      onChange(storageValue);

      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = inputValue.slice(0, cursorPos);
      const lastWord = textBeforeCursor.split(/[\s+\-*/()]+/).pop() || "";
      const suggestionType = detectSuggestionType(lastWord);
      const filter = getSuggestionFilter(lastWord);

      if (!lastWord) {
        setSuggestions([]);
        setShowSuggestion(false);
        return;
      }

      if (lastWord.startsWith("#F")) {
        setSuggestionFilter(filter);
        const filteredFields = fields.filter((field) => {
          const name = field.businessName || field.name;
          return name?.toLowerCase().includes(filter.toLowerCase());
        });
        setSuggestions(
          filteredFields.map((f) => ({
            id: f.id,
            name: f.businessName || f.name,
            businessName: f.businessName,
            tableName: f.tableName,
            type: "field" as const,
          })),
        );
        setShowSuggestion(true);
      } else if (lastWord.startsWith("#M")) {
        setSuggestionFilter(filter);
        const filteredMetrics = metrics.filter((metric) => {
          const name = metric.businessName || metric.name;
          return name?.toLowerCase().includes(filter.toLowerCase());
        });
        setSuggestions(
          filteredMetrics.map((m) => ({
            id: m.id,
            name: m.businessName || m.name,
            businessName: m.businessName,
            type: "metric" as const,
          })),
        );
        setShowSuggestion(true);
      } else if (suggestionType === "function") {
        setSuggestionFilter(filter);
        const filteredFunctions = AGGREGATE_FUNCTIONS.filter((fn) =>
          fn.name.toLowerCase().includes(filter.toLowerCase()),
        );
        setSuggestions(filteredFunctions);
        setShowSuggestion(true);
      } else {
        setShowSuggestion(false);
        setSuggestions([]);
      }
    },
    [
      onChange,
      toStorage,
      detectSuggestionType,
      getSuggestionFilter,
      fields,
      metrics,
    ],
  );

  const handleSuggestionSelect = useCallback(
    (item: SuggestionItem) => {
      const inputEl = inputRef.current;
      if (!inputEl) return;

      const cursorPos = inputEl.selectionStart;
      const textBefore = displayValue.slice(0, cursorPos);
      const textAfter = displayValue.slice(cursorPos);

      const lastWord = textBefore.split(/[\s+\-*/()]+/).pop() || "";
      const prefix = lastWord.startsWith("#F")
        ? "#F"
        : lastWord.startsWith("#M")
          ? "#M"
          : "";

      let insertText: string;
      let cursorOffset: number;

      if (item.type === "function") {
        const fn = item as FunctionItem;
        insertText = `${fn.name}()`;
        cursorOffset = fn.name.length + 1;
      } else if (item.type === "field") {
        const field = item as FieldItem;
        insertText = prefix ? `#F${field.id}` : field.name;
        cursorOffset = insertText.length;
      } else if (item.type === "metric") {
        const metric = item as MetricItem;
        insertText = prefix ? `#M${metric.id}` : metric.name;
        cursorOffset = insertText.length;
      } else {
        insertText = (item as unknown as any).name;
        cursorOffset = insertText.length;
      }

      const insertPosition = textBefore.length - lastWord.length;
      const newTextBefore = textBefore.slice(0, insertPosition) + insertText;
      const newText = newTextBefore + textAfter;

      onChange(toStorage(newText));
      setShowSuggestion(false);

      setTimeout(() => {
        const newCursorPos = insertPosition + cursorOffset;
        inputEl.setSelectionRange(newCursorPos, newCursorPos);
        inputEl.focus();
      }, 0);
    },
    [displayValue, onChange, toStorage],
  );

  const handleClickInsert = useCallback(
    (item: SuggestionItem) => {
      handleSuggestionSelect(item);
    },
    [handleSuggestionSelect],
  );

  return (
    <div className={styles.container}>
      <div className={styles.editorSection}>
        <div className={styles.editorWrapper} ref={wrapperRef}>
          <textarea
            ref={inputRef}
            className={styles.textarea}
            value={displayValue}
            onChange={handleInputChange}
            placeholder="输入公式，如: SUM(amount) * price"
            rows={6}
            onFocus={() => {
              if (displayValue) {
                const lastWord = displayValue.split(/[\s+\-*/()]+/).pop() || "";
                if (lastWord.startsWith("#F") || lastWord.startsWith("#M")) {
                  const suggestionType = detectSuggestionType(lastWord);
                  if (suggestionType) {
                    setSuggestionFilter(getSuggestionFilter(lastWord));
                    if (lastWord.startsWith("#F")) {
                      setSuggestions(
                        fields.map((f) => ({
                          id: f.id,
                          name: f.businessName || f.name,
                          businessName: f.businessName,
                          tableName: f.tableName,
                          type: "field" as const,
                        })),
                      );
                    } else if (lastWord.startsWith("#M")) {
                      setSuggestions(
                        metrics.map((m) => ({
                          id: m.id,
                          name: m.businessName || m.name,
                          businessName: m.businessName,
                          type: "metric" as const,
                        })),
                      );
                    }
                    setShowSuggestion(true);
                  }
                }
              }
            }}
          />
          {showSuggestion && (
            <FormulaSuggestion
              items={suggestions}
              onSelect={handleSuggestionSelect}
              anchorRef={inputRef}
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
          <ScrollArea style={{ maxHeight: "200px" }}>
            {activeTab === "function" && (
              <div className={styles.itemList}>
                {AGGREGATE_FUNCTIONS.map((fn) => (
                  <button
                    key={fn.name}
                    className={styles.itemButton}
                    onClick={() => handleClickInsert(fn)}
                  >
                    <span className={styles.functionBadge}>fn</span>
                    <span className={styles.itemName}>{fn.name}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === "field" && (
              <div className={styles.itemList}>
                {fields.map((field) => (
                  <button
                    key={field.id}
                    className={styles.itemButton}
                    onClick={() =>
                      handleClickInsert({
                        id: field.id,
                        name: field.businessName || field.name,
                        businessName: field.businessName,
                        tableName: field.tableName,
                        type: "field",
                      } as FieldItem)
                    }
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
              </div>
            )}

            {activeTab === "metric" && (
              <div className={styles.itemList}>
                {metrics.map((metric) => (
                  <button
                    key={metric.id}
                    className={styles.itemButton}
                    onClick={() =>
                      handleClickInsert({
                        id: metric.id,
                        name: metric.businessName || metric.name,
                        businessName: metric.businessName,
                        type: "metric",
                      } as MetricItem)
                    }
                  >
                    <span className={styles.metricBadge}>M</span>
                    <span className={styles.itemName}>
                      {metric.businessName || metric.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
