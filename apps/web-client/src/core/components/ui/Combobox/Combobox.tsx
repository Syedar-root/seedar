import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import clsx from "clsx";
import { CheckIcon, ChevronDown, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useState } from "react";
import styles from "./Combobox.module.scss";

export interface ComboboxOption {
  label: string;
  value: string;
}

export interface ComboboxOptionGroup {
  label?: string;
  options: ComboboxOption[];
}

export interface ComboboxProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  options: ComboboxOption[] | ComboboxOptionGroup[];
  className?: string;
  style?: CSSProperties;
  clearable?: boolean;
}

const isGroupedOptions = (
  options: ComboboxProps["options"],
): options is ComboboxOptionGroup[] => {
  return options.length > 0 && "options" in options[0];
};

const normalizeGroups = (
  options: ComboboxProps["options"],
): ComboboxOptionGroup[] => {
  if (isGroupedOptions(options)) {
    return options;
  }

  return [{ options }];
};

const flattenGroups = (groups: ComboboxOptionGroup[]) =>
  groups.flatMap((group) => group.options);

const filterGroups = (groups: ComboboxOptionGroup[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return groups.filter((group) => group.options.length > 0);
  }

  return groups
    .map((group) => ({
      ...group,
      options: group.options.filter((option) => {
        const haystack = `${option.label} ${option.value}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      }),
    }))
    .filter((group) => group.options.length > 0);
};

export const Combobox = ({
  value,
  onChange,
  placeholder = "Select",
  searchPlaceholder = "Search",
  emptyText = "No options",
  options,
  className,
  style,
  clearable = true,
}: ComboboxProps) => {
  const [query, setQuery] = useState("");
  const groups = normalizeGroups(options);
  const flatOptions = flattenGroups(groups);
  const selectedOption =
    flatOptions.find((option) => option.value === value) ?? null;
  const visibleGroups = filterGroups(groups, query);
  const hasVisibleOptions = visibleGroups.some(
    (group) => group.options.length > 0,
  );

  return (
    <BaseCombobox.Root<ComboboxOption>
      value={selectedOption}
      itemToStringLabel={(option) => option.label}
      itemToStringValue={(option) => option.value}
      isItemEqualToValue={(item, selectedValue) =>
        item.value === selectedValue.value
      }
      onValueChange={(nextValue) => {
        onChange?.(nextValue?.value ?? null);
        setQuery("");
      }}
      onInputValueChange={setQuery}
      onOpenChange={(open) => {
        if (open) {
          setQuery("");
        }
      }}
    >
      <div className={clsx(styles.Control, className)} style={style}>
        <BaseCombobox.InputGroup className={styles.InputGroup}>
          <BaseCombobox.Input
            className={styles.Input}
            placeholder={selectedOption ? undefined : placeholder}
            aria-label={searchPlaceholder}
          />
          <div className={styles.ActionButtons}>
            {clearable ? (
              <BaseCombobox.Clear
                className={styles.Clear}
                aria-label="Clear selection"
              >
                <X size={14} />
              </BaseCombobox.Clear>
            ) : null}
            <BaseCombobox.Trigger
              className={styles.Trigger}
              aria-label="Open options"
            >
              <ChevronDown size={16} />
            </BaseCombobox.Trigger>
          </div>
        </BaseCombobox.InputGroup>
      </div>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner className={styles.Positioner} sideOffset={6}>
          <BaseCombobox.Popup className={styles.Popup}>
            <BaseCombobox.List className={styles.List}>
              {hasVisibleOptions ? (
                visibleGroups.map((group, groupIndex) => (
                  <BaseCombobox.Group
                    key={group.label || `group-${groupIndex}`}
                    className={styles.Group}
                  >
                    {group.label ? (
                      <BaseCombobox.GroupLabel className={styles.GroupLabel}>
                        {group.label}
                      </BaseCombobox.GroupLabel>
                    ) : null}
                    {group.options.map((option) => (
                      <BaseCombobox.Item
                        key={`${group.label || "option"}-${option.value}`}
                        value={option}
                        className={styles.Item}
                      >
                        <span className={styles.ItemText}>{option.label}</span>
                        <BaseCombobox.ItemIndicator
                          className={styles.ItemIndicator}
                        >
                          <CheckIcon size={14} />
                        </BaseCombobox.ItemIndicator>
                      </BaseCombobox.Item>
                    ))}
                  </BaseCombobox.Group>
                ))
              ) : (
                <div className={styles.Empty}>{emptyText}</div>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
};
