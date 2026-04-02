import { Select as BaseSelect } from "@base-ui/react";
import styles from "./Select.module.scss";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import clsx from "clsx";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  value?: string;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  options: SelectOption[];
  className?: string;
  style?: React.CSSProperties;
  clearable?: boolean;
  label?: string;
}

export const Select = ({
  value,
  onChange,
  placeholder = "请选择",
  options,
  className,
  style,
  clearable = true,
  label = "",
}: SelectProps) => {
  const allOptions = clearable
    ? [{ label: placeholder, value: "__clear__" }, ...options]
    : options;

  const handleValueChange = (newValue: string | null) => {
    if (newValue === "__clear__") {
      onChange?.(null);
    } else {
      onChange?.(newValue);
    }
  };

  return (
    <BaseSelect.Root
      items={allOptions}
      value={value}
      onValueChange={handleValueChange}
    >
      <BaseSelect.Trigger
        className={clsx(styles.Select, className)}
        style={style}
      >
        {label && (
          <BaseSelect.Label className={styles.Label}>
            {label}:{" "}
          </BaseSelect.Label>
        )}
        <BaseSelect.Value className={styles.Value} placeholder={placeholder} />
        <BaseSelect.Icon className={styles.SelectIcon}>
          <ChevronsUpDown size={"16"} />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className={styles.Positioner}>
          <BaseSelect.Popup className={styles.Popup}>
            <BaseSelect.List className={styles.List}>
              {allOptions.map(({ label, value }) => (
                <BaseSelect.Item
                  key={label}
                  value={value}
                  className={styles.Item}
                >
                  <BaseSelect.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon className={styles.ItemIndicatorIcon} />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText className={styles.ItemText}>
                    {label}
                  </BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
            <BaseSelect.ScrollDownArrow className={styles.ScrollArrow} />
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
};
