import { useEffect, useState, useCallback, useRef } from "react";
import {
  SuggestionItem,
  FunctionItem,
  FieldItem,
  MetricItem,
} from "./useFormulaParser";
import { createPortal } from "react-dom";
import styles from "./FormulaSuggestion.module.scss";

interface FormulaSuggestionProps {
  items: SuggestionItem[];
  onSelect: (item: SuggestionItem) => void;
  anchorRef: React.RefObject<HTMLTextAreaElement>;
  onClose: () => void;
}

export const FormulaSuggestion: React.FC<FormulaSuggestionProps> = ({
  items,
  onSelect,
  anchorRef,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, [anchorRef, items]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleScroll = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [anchorRef, onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (items[selectedIndex]) {
            onSelect(items[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
      }
    },
    [items, selectedIndex, onSelect, onClose],
  );

  const handleKeyDownRef = useRef(handleKeyDown);
  handleKeyDownRef.current = handleKeyDown;

  const renderItem = (item: SuggestionItem, index: number) => {
    if (item.type === "function") {
      const fn = item as FunctionItem;
      return (
        <li
          key={fn.name}
          onClick={() => onSelect(fn)}
          className={`${styles.item} ${index === selectedIndex ? styles.selected : ""}`}
        >
          <span className={styles.functionBadge}>fn</span>
          <span className={styles.itemName}>{fn.name}</span>
          <span className={styles.itemDesc}>{fn.description}</span>
        </li>
      );
    }

    if (item.type === "field") {
      const field = item as FieldItem;
      return (
        <li
          key={`field-${field.id}`}
          onClick={() => onSelect(field)}
          className={`${styles.item} ${index === selectedIndex ? styles.selected : ""}`}
        >
          <span className={styles.fieldBadge}>F</span>
          <span className={styles.itemName}>
            {field.name}{" "}
            {field.tableName && (
              <span className={styles.tableTag}>来自: {field.tableName}</span>
            )}
          </span>

          <span className={styles.itemId}>#F{field.id}</span>
        </li>
      );
    }

    if (item.type === "metric") {
      const metric = item as MetricItem;
      return (
        <li
          key={`metric-${metric.id}`}
          onClick={() => onSelect(metric)}
          className={`${styles.item} ${index === selectedIndex ? styles.selected : ""}`}
        >
          <span className={styles.metricBadge}>M</span>
          <span className={styles.itemName}>{metric.name}</span>
          <span className={styles.itemId}>#M{metric.id}</span>
        </li>
      );
    }

    return null;
  };

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const handleKeyDownWrapper = (e: KeyboardEvent) => {
      handleKeyDownRef.current(e);
    };

    anchor.addEventListener("keydown", handleKeyDownWrapper, true);

    return () => {
      anchor.removeEventListener("keydown", handleKeyDownWrapper, true);
    };
  }, [anchorRef]);

  if (!anchorRef.current) return null;

  return createPortal(
    <div
      ref={popupRef}
      className={styles.popup}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 9999,
      }}
    >
      <ul className={styles.list}>
        {items.length === 0 ? (
          <li className={styles.empty}>没有找到匹配的项</li>
        ) : (
          items.map((item, index) => renderItem(item, index))
        )}
      </ul>
    </div>,
    document.body,
  );
};
