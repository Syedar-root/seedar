import { useState, useCallback, useRef, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { DatasetFieldResponse, DatasetMetricResponse } from '#pkg/seedar/types';
import { useFormulaParser, SuggestionItem, AGGREGATE_FUNCTIONS, FunctionItem, FieldItem, MetricItem } from './useFormulaParser';
import { FormulaSuggestion } from './FormulaSuggestion';
import styles from './formulaEditor.module.scss';

interface FormulaEditorProps {
  fields: DatasetFieldResponse[];
  metrics: DatasetMetricResponse[];
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
  const [suggestionFilter, setSuggestionFilter] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { toDisplay, toStorage, detectSuggestionType, getSuggestionFilter } = useFormulaParser({
    fields,
    metrics,
  });

  const displayValue = toDisplay(value);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const inputValue = e.target.value;
      const storageValue = toStorage(inputValue);
      onChange(storageValue);

      const lastWord = inputValue.split(/[\s+\-*/()]+/).pop() || '';
      const suggestionType = detectSuggestionType(lastWord);
      const filter = getSuggestionFilter(lastWord);

      if (lastWord.startsWith('#F')) {
        setSuggestionFilter(filter);
        const filteredFields = fields.filter((field) => {
          const name = field.businessName || field.name;
          return name?.toLowerCase().includes(filter.toLowerCase());
        });
        setSuggestions(filteredFields.map((f) => ({
          id: f.id,
          name: f.businessName || f.name,
          businessName: f.businessName,
          type: 'field' as const,
        })));
        setShowSuggestion(true);
      } else if (lastWord.startsWith('#M')) {
        setSuggestionFilter(filter);
        const filteredMetrics = metrics.filter((metric) => {
          const name = metric.businessName || metric.name;
          return name?.toLowerCase().includes(filter.toLowerCase());
        });
        setSuggestions(filteredMetrics.map((m) => ({
          id: m.id,
          name: m.businessName || m.name,
          businessName: m.businessName,
          type: 'metric' as const,
        })));
        setShowSuggestion(true);
      } else if (suggestionType === 'function') {
        setSuggestionFilter(filter);
        const filteredFunctions = AGGREGATE_FUNCTIONS.filter((fn) =>
          fn.name.toLowerCase().includes(filter.toLowerCase())
        );
        setSuggestions(filteredFunctions);
        setShowSuggestion(true);
      } else {
        setShowSuggestion(false);
      }
    },
    [onChange, toStorage, detectSuggestionType, getSuggestionFilter, fields, metrics]
  );

  const handleSuggestionSelect = useCallback(
    (item: SuggestionItem) => {
      const inputEl = inputRef.current;
      if (!inputEl) return;

      const cursorPos = inputEl.selectionStart;
      const textBefore = displayValue.slice(0, cursorPos);
      const textAfter = displayValue.slice(cursorPos);

      const lastWord = textBefore.split(/[\s+\-*/()]+/).pop() || '';
      const prefix = lastWord.startsWith('#F') ? '#F' : lastWord.startsWith('#M') ? '#M' : '';

      let insertText: string;
      let cursorOffset: number;

      if (item.type === 'function') {
        const fn = item as FunctionItem;
        insertText = `${fn.name}()`;
        cursorOffset = fn.name.length + 1;
      } else if (item.type === 'field') {
        const field = item as FieldItem;
        insertText = prefix ? `#F${field.id}` : field.name;
        cursorOffset = insertText.length;
      } else if (item.type === 'metric') {
        const metric = item as MetricItem;
        insertText = prefix ? `#M${metric.id}` : metric.name;
        cursorOffset = insertText.length;
      } else {
        insertText = item.name;
        cursorOffset = insertText.length;
      }

      const newTextBefore = textBefore.slice(0, textBefore.length - lastWord.length) + insertText;
      const newText = newTextBefore + textAfter;
      
      onChange(toStorage(newText));
      setShowSuggestion(false);

      setTimeout(() => {
        const newCursorPos = newTextBefore.length + cursorOffset;
        inputEl.setSelectionRange(newCursorPos, newCursorPos);
        inputEl.focus();
      }, 0);
    },
    [displayValue, onChange, toStorage]
  );

  const handleClickInsert = useCallback(
    (item: SuggestionItem) => {
      handleSuggestionSelect(item);
    },
    [handleSuggestionSelect]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestion(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderKaTeX = (expr: string) => {
    try {
      const latex = convertToLatex(expr);
      if (!latex) return <span className={styles.placeholder}>预览区域</span>;
      
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(latex, {
              throwOnError: false,
              displayMode: true,
            }),
          }}
        />
      );
    } catch {
      return <span className={styles.previewText}>{expr}</span>;
    }
  };

  const convertToLatex = (expr: string): string => {
    let latex = expr;

    latex = latex.replace(/#F(\d+)/g, (_, id) => {
      const field = fields.find(f => f.id === parseInt(id));
      return field?.businessName || field?.name || `F${id}`;
    });

    latex = latex.replace(/#M(\d+)/g, (_, id) => {
      const metric = metrics.find(m => m.id === parseInt(id));
      return metric?.businessName || metric?.name || `M${id}`;
    });

    latex = latex.replace(/\*/g, ' \\times ');
    latex = latex.replace(/\//g, ' \\div ');

    return latex;
  };

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
            rows={3}
            onFocus={() => {
              if (displayValue) {
                const lastWord = displayValue.split(/[\s+\-*/()]+/).pop() || '';
                if (lastWord.startsWith('#F') || lastWord.startsWith('#M')) {
                  const suggestionType = detectSuggestionType(lastWord);
                  if (suggestionType) {
                    setSuggestionFilter(getSuggestionFilter(lastWord));
                    if (lastWord.startsWith('#F')) {
                      setSuggestions(fields.map((f) => ({
                        id: f.id,
                        name: f.businessName || f.name,
                        businessName: f.businessName,
                        type: 'field' as const,
                      })));
                    } else if (lastWord.startsWith('#M')) {
                      setSuggestions(metrics.map((m) => ({
                        id: m.id,
                        name: m.businessName || m.name,
                        businessName: m.businessName,
                        type: 'metric' as const,
                      })));
                    }
                    setShowSuggestion(true);
                  }
                }
              }
            }}
          />
          <FormulaSuggestion
            items={suggestions}
            onSelect={handleSuggestionSelect}
            filter={suggestionFilter}
            onFilterChange={setSuggestionFilter}
            visible={showSuggestion}
            onVisibleChange={setShowSuggestion}
          />
        </div>

        <div className={styles.referencePanel}>
          <div className={styles.referenceSection}>
            <div className={styles.referenceTitle}>可用函数</div>
            <div className={styles.referenceList}>
              {AGGREGATE_FUNCTIONS.map((fn) => (
                <button
                  key={fn.name}
                  className={styles.referenceItem}
                  onClick={() => handleClickInsert(fn)}
                >
                  <span className={styles.functionBadge}>fn</span>
                  <span>{fn.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.referenceSection}>
            <div className={styles.referenceTitle}>可用字段</div>
            <div className={styles.referenceList}>
              {fields.map((field) => (
                <button
                  key={field.id}
                  className={styles.referenceItem}
                  onClick={() => handleClickInsert({ id: field.id, name: field.businessName || field.name, businessName: field.businessName, type: 'field' } as FieldItem)}
                >
                  <span className={styles.fieldBadge}>F</span>
                  <span>{field.businessName || field.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.referenceSection}>
            <div className={styles.referenceTitle}>可用指标</div>
            <div className={styles.referenceList}>
              {metrics.map((metric) => (
                <button
                  key={metric.id}
                  className={styles.referenceItem}
                  onClick={() => handleClickInsert({ id: metric.id, name: metric.businessName || metric.name, businessName: metric.businessName, type: 'metric' } as MetricItem)}
                >
                  <span className={styles.metricBadge}>M</span>
                  <span>{metric.businessName || metric.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.previewSection}>
        <div className={styles.preview}>
          <div className={styles.previewLabel}>预览</div>
          <div className={styles.previewContent}>
            {renderKaTeX(displayValue)}
          </div>
        </div>
      </div>
    </div>
  );
};
