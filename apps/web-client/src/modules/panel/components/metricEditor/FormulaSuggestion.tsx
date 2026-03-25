import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Command } from "cmdk";
import {
  SuggestionItem,
  FunctionItem,
  FieldItem,
  MetricItem,
} from "./useFormulaParser";
import styles from "./formulaSuggestion.module.scss";

interface FormulaSuggestionProps {
  items: SuggestionItem[];
  onSelect: (item: SuggestionItem) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  anchorRef: React.RefObject<HTMLTextAreaElement>;
}

export const FormulaSuggestion: React.FC<FormulaSuggestionProps> = ({
  items,
  onSelect,
  filter,
  onFilterChange,
  visible,
  onVisibleChange,
  anchorRef,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    setSelectedIndex(0);
  }, [items, filter]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible) return;
      console.log("e.key", e.key);
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
            console.log("hcs", items[selectedIndex]);
            onSelect(items[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onVisibleChange(false);
          break;
      }
    },
    [visible, items, selectedIndex, onSelect, onVisibleChange],
  );

  // useEffect(() => {
  //   document.addEventListener("keydown", handleKeyDown);
  //   return () => document.removeEventListener("keydown", handleKeyDown);
  // }, [handleKeyDown]);

  // useEffect(() => {
  //   if (listRef.current) {
  //     const selectedElement = listRef.current.children[
  //       selectedIndex
  //     ] as HTMLElement;
  //     if (selectedElement) {
  //       selectedElement.scrollIntoView({ block: "nearest" });
  //     }
  //   }
  // }, [selectedIndex]);

  const renderItem = (item: SuggestionItem, index: number) => {
    if (item.type === "function") {
      const fn = item as FunctionItem;
      return (
        <Command.Item
          key={fn.name}
          value={fn.name}
          onSelect={() => onSelect(fn)}
          className={`${styles.item} ${index === selectedIndex ? styles.selected : ""}`}
        >
          <span className={styles.functionBadge}>fn</span>
          <span className={styles.itemName}>{fn.name}</span>
          <span className={styles.itemDesc}>{fn.description}</span>
        </Command.Item>
      );
    }

    if (item.type === "field") {
      const field = item as FieldItem;
      return (
        <Command.Item
          key={`field-${field.id}`}
          value={`${field.name} #F${field.id}`}
          onSelect={() => onSelect(field)}
          className={`${styles.item} ${index === selectedIndex ? styles.selected : ""}`}
        >
          <span className={styles.fieldBadge}>F</span>
          <span className={styles.itemName}>{field.name}</span>
          <span className={styles.itemId}>#F{field.id}</span>
        </Command.Item>
      );
    }

    if (item.type === "metric") {
      const metric = item as MetricItem;
      return (
        <Command.Item
          key={`metric-${metric.id}`}
          value={`${metric.name} #M${metric.id}`}
          onSelect={() => onSelect(metric)}
          className={`${styles.item} ${index === selectedIndex ? styles.selected : ""}`}
        >
          <span className={styles.metricBadge}>M</span>
          <span className={styles.itemName}>{metric.name}</span>
          <span className={styles.itemId}>#M{metric.id}</span>
        </Command.Item>
      );
    }

    return null;
  };

  const updatePosition = useCallback(() => {
    if (!anchorRef.current || !visible) return;

    const rect = anchorRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, [anchorRef, visible]);

  useEffect(() => {
    if (visible) {
      updatePosition();
    }
  }, [visible, updatePosition]);

  useEffect(() => {
    if (visible) {
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();

      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [visible, updatePosition]);

  if (!visible) return null;

  const content = (
    <Command
      className={styles.command}
      loop
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
    >
      <Command.Input
        value={filter}
        onValueChange={onFilterChange}
        style={{ display: "none" }} // 隐藏但保留功能
        autoFocus
      />
      <Command.List ref={listRef} className={styles.list}>
        {items.length === 0 ? (
          <Command.Empty className={styles.empty}>
            没有找到匹配的项
          </Command.Empty>
        ) : (
          items.map((item, index) => renderItem(item, index))
        )}
      </Command.List>
    </Command>
  );

  return createPortal(content, document.body);
};
