import React from "react";
import { X } from "lucide-react";
import { FilterItem as FilterItemType, OPERATORS_BY_TYPE, NO_VALUE_OPERATORS, TIME_RANGE_OPERATORS } from "./types";
import { FieldType } from "#pkg/seedar/types";
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
  const operators = OPERATORS_BY_TYPE[filter.fieldType] || OPERATORS_BY_TYPE[FieldType.STRING];
  const needsValue = !NO_VALUE_OPERATORS.includes(filter.op);
  const isTimeRange = TIME_RANGE_OPERATORS.includes(filter.op);

  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOp = e.target.value;
    onUpdate(filter.id, { op: newOp, value: undefined });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value: any = e.target.value;
    
    if (filter.fieldType === FieldType.NUMBER || filter.fieldType === FieldType.DECIMAL) {
      value = value === "" ? undefined : Number(value);
    }
    
    if (isTimeRange) {
      value = value === "" ? undefined : Number(value);
    }
    
    onUpdate(filter.id, { value });
  };

  const renderValueInput = () => {
    if (!needsValue) return null;

    if (isTimeRange) {
      return (
        <input
          type="number"
          className={styles.valueInput}
          value={filter.value ?? ""}
          onChange={handleValueChange}
          placeholder="N"
          min={1}
        />
      );
    }

    switch (filter.fieldType) {
      case FieldType.NUMBER:
      case FieldType.DECIMAL:
        return (
          <input
            type="number"
            className={styles.valueInput}
            value={filter.value ?? ""}
            onChange={handleValueChange}
            placeholder="输入数值"
          />
        );

      case FieldType.BOOLEAN:
        return (
          <select
            className={styles.valueSelect}
            value={filter.value ?? ""}
            onChange={handleValueChange}
          >
            <option value="">请选择</option>
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
        );

      case FieldType.DATE:
        return (
          <input
            type="date"
            className={styles.valueInput}
            value={filter.value ?? ""}
            onChange={handleValueChange}
          />
        );

      case FieldType.DATETIME:
        return (
          <input
            type="datetime-local"
            className={styles.valueInput}
            value={filter.value ?? ""}
            onChange={handleValueChange}
          />
        );

      default:
        return (
          <input
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
      <select
        className={styles.operatorSelect}
        value={filter.op}
        onChange={handleOperatorChange}
      >
        {operators.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
      {renderValueInput()}
      <X
        size={12}
        className={styles.removeBtn}
        onClick={() => onRemove(filter.id)}
      />
    </div>
  );
};
