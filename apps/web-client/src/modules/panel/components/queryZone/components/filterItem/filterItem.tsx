import React, { useState, useRef } from "react";
import { X, Check } from "lucide-react";
import {
  FilterItem as FilterItemType,
  OPERATORS_BY_TYPE,
  NO_VALUE_OPERATORS,
  TIME_RANGE_OPERATORS,
  ARRAY_VALUE_OPERATORS,
  RANGE_VALUE_OPERATORS,
} from "../../types";
import { FieldType } from "#pkg/seedar/types";
import { Select } from "@base-ui/react/select";
import { Input } from "@base-ui/react/input";
import styles from "./filterItem.module.scss";

interface FilterItemProps {
  filter: FilterItemType;
  onUpdate: (id: string | number, updates: Partial<FilterItemType>) => void;
  onRemove: (id: string | number) => void;
}

export const FilterItem: React.FC<FilterItemProps> = ({
  filter,
  onUpdate,
  onRemove,
}) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const operators =
    OPERATORS_BY_TYPE[filter.fieldType] || OPERATORS_BY_TYPE[FieldType.STRING];
  const needsValue = !NO_VALUE_OPERATORS.includes(filter.op);
  const isTimeRange = TIME_RANGE_OPERATORS.includes(filter.op);
  const isArrayValue = ARRAY_VALUE_OPERATORS.includes(filter.op);
  const isRangeValue = RANGE_VALUE_OPERATORS.includes(filter.op);

  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOp = e.target.value;
    onUpdate(filter.id, { op: newOp, value: undefined });
  };

  const handleValueChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    let value: any = e.target.value;

    if (
      filter.fieldType === FieldType.NUMBER ||
      filter.fieldType === FieldType.DECIMAL
    ) {
      value = value === "" ? undefined : Number(value);
    }

    if (isTimeRange) {
      value = value === "" ? undefined : Number(value);
    }

    onUpdate(filter.id, { value });
  };

  const handleAddArrayValue = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;

    const value = inputValue.trim();
    if (!value) return;

    const currentValues = Array.isArray(filter.value) ? filter.value : [];
    if (currentValues.includes(value)) return;

    onUpdate(filter.id, { value: [...currentValues, value] });
    setInputValue("");
  };

  const handleRemoveArrayValue = (index: number) => {
    const currentValues = Array.isArray(filter.value) ? filter.value : [];
    const newValues = currentValues.filter((_, i) => i !== index);
    onUpdate(filter.id, {
      value: newValues.length > 0 ? newValues : undefined,
    });
  };

  const handleRangeChange = (key: "low" | "high", value: string) => {
    const rangeValue = (filter.value as { low?: number; high?: number }) || {};
    const numValue = value === "" ? undefined : Number(value);
    onUpdate(filter.id, {
      value: { ...rangeValue, [key]: numValue },
    });
  };

  const renderArrayInput = () => {
    if (!isArrayValue) return null;

    const values = Array.isArray(filter.value) ? filter.value : [];

    return (
      <div className={styles.arrayInput}>
        {values.map((v, idx) => (
          <span key={idx} className={styles.tag}>
            {String(v)}
            <X
              size={10}
              className={styles.tagRemove}
              onClick={() => handleRemoveArrayValue(idx)}
            />
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className={styles.arrayInputField}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleAddArrayValue}
          placeholder="输入后回车"
        />
      </div>
    );
  };

  const renderRangeInput = () => {
    if (!isRangeValue) return null;

    // 时间类型使用日期范围选择
    if (
      filter.fieldType === FieldType.DATE ||
      filter.fieldType === FieldType.DATETIME
    ) {
      return renderDateRangeInput();
    }

    const rangeValue = (filter.value as { low?: number; high?: number }) || {};

    return (
      <div className={styles.rangeInput}>
        <Input
          type="number"
          className={styles.rangeInputField}
          value={rangeValue.low ?? ""}
          onChange={(e) => handleRangeChange("low", e.target.value)}
          placeholder="最小值"
        />
        <span className={styles.rangeSeparator}>至</span>
        <Input
          type="number"
          className={styles.rangeInputField}
          value={rangeValue.high ?? ""}
          onChange={(e) => handleRangeChange("high", e.target.value)}
          placeholder="最大值"
        />
      </div>
    );
  };

  const handleDateRangeChange = (key: "low" | "high", value: string) => {
    const rangeValue = (filter.value as { low?: string; high?: string }) || {};
    onUpdate(filter.id, {
      value: { ...rangeValue, [key]: value },
    });
  };

  const renderDateRangeInput = () => {
    const rangeValue = (filter.value as { low?: string; high?: string }) || {};
    const inputType =
      filter.fieldType === FieldType.DATETIME ? "datetime-local" : "date";

    return (
      <div className={styles.rangeInput}>
        <Input
          type={inputType}
          className={styles.rangeInputField}
          value={rangeValue.low ?? ""}
          onChange={(e) => handleDateRangeChange("low", e.target.value)}
          placeholder="开始日期"
        />
        <span className={styles.rangeSeparator}>至</span>
        <Input
          type={inputType}
          className={styles.rangeInputField}
          value={rangeValue.high ?? ""}
          onChange={(e) => handleDateRangeChange("high", e.target.value)}
          placeholder="结束日期"
        />
      </div>
    );
  };

  const renderValueInput = () => {
    if (!needsValue) return null;

    if (isArrayValue) {
      return renderArrayInput();
    }

    if (isRangeValue) {
      return renderRangeInput();
    }

    if (isTimeRange) {
      return (
        <>
          <Input
            type="number"
            className={styles.valueInput}
            value={filter.value ?? ""}
            onChange={handleValueChange}
            placeholder="N"
            min={1}
          />
          天
        </>
      );
    }

    switch (filter.fieldType) {
      case FieldType.NUMBER:
      case FieldType.DECIMAL:
        return (
          <Input
            type="number"
            className={styles.valueInput}
            value={filter.value ?? ""}
            onChange={handleValueChange}
            placeholder="输入数值"
          />
        );

      case FieldType.BOOLEAN:
        return (
          <Select.Root
            value={filter.value ?? null}
            onValueChange={(value) =>
              onUpdate(filter.id, { value: value ?? undefined })
            }
          >
            <Select.Trigger className={styles.valueTrigger}>
              <Select.Value placeholder="请选择" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner className={styles.positioner}>
                <Select.Popup className={styles.popup}>
                  <Select.List className={styles.list}>
                    <Select.Item className={styles.item} value="true">
                      <Select.ItemIndicator className={styles.indicator}>
                        <Check size={12} />
                      </Select.ItemIndicator>
                      <Select.ItemText>是</Select.ItemText>
                    </Select.Item>
                    <Select.Item className={styles.item} value="false">
                      <Select.ItemIndicator className={styles.indicator}>
                        <Check size={12} />
                      </Select.ItemIndicator>
                      <Select.ItemText>否</Select.ItemText>
                    </Select.Item>
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        );

      case FieldType.DATE:
        return (
          <Input
            type="date"
            className={styles.valueInput}
            value={filter.value ?? ""}
            onChange={handleValueChange}
          />
        );

      case FieldType.DATETIME:
        return (
          <Input
            type="datetime-local"
            className={styles.valueInput}
            value={filter.value ?? ""}
            onChange={handleValueChange}
          />
        );

      default:
        return (
          <Input
            type="text"
            className={styles.valueInput}
            value={filter.value ?? ""}
            onChange={handleValueChange}
            placeholder="输入值"
          />
        );
    }
  };

  return (
    <div className={styles.filterItem}>
      <span className={styles.name}>{filter.name}</span>
      <Select.Root
        value={filter.op}
        onValueChange={(value) =>
          onUpdate(filter.id, { op: value ?? undefined, value: undefined })
        }
      >
        <Select.Trigger className={styles.operatorTrigger}>
          <Select.Value>
            {operators.find((op) => op.value === filter.op)?.label ?? filter.op}
          </Select.Value>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={styles.positioner}>
            <Select.Popup className={styles.popup}>
              <Select.List className={styles.list}>
                {operators.map((op) => (
                  <Select.Item
                    key={op.value}
                    className={styles.item}
                    value={op.value}
                  >
                    <Select.ItemIndicator className={styles.indicator}>
                      <Check size={12} />
                    </Select.ItemIndicator>
                    <Select.ItemText>{op.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      {renderValueInput()}
      <X
        size={12}
        className={styles.removeBtn}
        onClick={() => onRemove(filter.id)}
      />
    </div>
  );
};
