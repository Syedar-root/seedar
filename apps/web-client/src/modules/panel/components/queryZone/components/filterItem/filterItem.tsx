import React from "react";
import { X } from "lucide-react";
import {
  Button,
  DatePicker,
  Input,
  InputNumber,
  Popover,
  Select,
  Space,
  Tooltip,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  FilterItem as FilterItemType,
  OPERATORS_BY_TYPE,
  NO_VALUE_OPERATORS,
  TIME_RANGE_OPERATORS,
  ARRAY_VALUE_OPERATORS,
  RANGE_VALUE_OPERATORS,
} from "../../types";
import { FieldType } from "#pkg/seedar/types";
import styles from "./filterItem.module.scss";

const { RangePicker } = DatePicker;
const TIME_RANGE_UNIT_MAP: Record<string, string> = {
  recent_days: "天",
  recent_weeks: "周",
  recent_months: "月",
};

interface FilterItemProps {
  filter: FilterItemType;
  onUpdate: (id: string | number, updates: Partial<FilterItemType>) => void;
  onRemove: (id: string | number) => void;
}

const formatShortValue = (value: unknown): string => {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const text = String(value).replace("T", " ");
  return text.length > 16 ? `${text.slice(0, 16)}...` : text;
};

export const FilterItem: React.FC<FilterItemProps> = ({
  filter,
  onUpdate,
  onRemove,
}) => {
  const operators =
    OPERATORS_BY_TYPE[filter.fieldType] || OPERATORS_BY_TYPE[FieldType.STRING];

  const needsValue = !NO_VALUE_OPERATORS.includes(filter.op);
  const isTimeRange = TIME_RANGE_OPERATORS.includes(filter.op);
  const isArrayValue = ARRAY_VALUE_OPERATORS.includes(filter.op);
  const isRangeValue = RANGE_VALUE_OPERATORS.includes(filter.op);

  const operatorOptions = operators.map((op) => ({
    value: op.value,
    label: op.label,
  }));

  const toSafeNumber = (value: unknown): number | undefined => {
    if (typeof value === "number") {
      return Number.isNaN(value) ? undefined : value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }

    return undefined;
  };

  const handleTextValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(filter.id, { value: e.target.value || undefined });
  };

  const handleNumberValueChange = (value: number | null) => {
    onUpdate(filter.id, { value: value ?? undefined });
  };

  const handleArrayValueChange = (values: string[]) => {
    const uniqueValues = Array.from(
      new Set(values.map((item) => item.trim()).filter(Boolean)),
    );

    onUpdate(filter.id, {
      value: uniqueValues.length > 0 ? uniqueValues : undefined,
    });
  };

  const handleRangeChange = (key: "low" | "high", value: number | null) => {
    const rangeValue = (filter.value as { low?: number; high?: number }) || {};
    onUpdate(filter.id, {
      value: { ...rangeValue, [key]: value ?? undefined },
    });
  };

  const renderCompactPopoverTrigger = (summary: string, content: React.ReactNode) => (
    <Popover
      trigger="click"
      placement="bottomLeft"
      content={<div className={styles.popoverEditor}>{content}</div>}
    >
      <Button size="small" className={styles.compactValueBtn}>
        <span className={styles.compactValueText}>{summary}</span>
      </Button>
    </Popover>
  );

  const renderArrayInput = () => {
    if (!isArrayValue) return null;

    const values = Array.isArray(filter.value)
      ? filter.value.map((item) => String(item))
      : [];

    const summary = values.length > 0 ? `${values.length}项` : "设置集合";

    return renderCompactPopoverTrigger(
      summary,
      <Select
        mode="tags"
        size="small"
        className={styles.popoverField}
        value={values}
        onChange={handleArrayValueChange}
        placeholder="输入后回车"
        allowClear
      />,
    );
  };

  const renderDateRangeInput = () => {
    const rangeSource = filter.value as
      | { low?: string; high?: string }
      | string[]
      | undefined;
    const lowRaw = Array.isArray(rangeSource)
      ? rangeSource[0]
      : rangeSource?.low;
    const highRaw = Array.isArray(rangeSource)
      ? rangeSource[1]
      : rangeSource?.high;
    const isDateTime = filter.fieldType === FieldType.DATETIME;
    const dateFormat = isDateTime ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD";

    const lowLabel = formatShortValue(lowRaw);
    const highLabel = formatShortValue(highRaw);
    const summary =
      lowLabel && highLabel
        ? `${lowLabel} ~ ${highLabel}`
        : lowLabel || highLabel || "选择时间";
    const parseDate = (value?: string): Dayjs | null => {
      if (!value) return null;

      const parsed = dayjs(value);
      if (parsed.isValid()) return parsed;

      if (isDateTime) {
        const fallback = dayjs(value.replace(" ", "T"));
        if (fallback.isValid()) return fallback;
      }

      return null;
    };
    const pickerValue: [Dayjs | null, Dayjs | null] = [
      parseDate(lowRaw),
      parseDate(highRaw),
    ];

    return renderCompactPopoverTrigger(
      summary,
      <RangePicker
        showTime={isDateTime ? { format: "HH:mm:ss" } : false}
        size="small"
        className={styles.popoverField}
        value={pickerValue}
        format={dateFormat}
        onChange={(dates) => {
          const low = dates?.[0] ? dates[0].format(dateFormat) : undefined;
          const high = dates?.[1] ? dates[1].format(dateFormat) : undefined;
          onUpdate(filter.id, {
            value: { low, high },
          });
        }}
      />,
    );
  };

  const renderSingleDateInput = () => {
    const isDateTime = filter.fieldType === FieldType.DATETIME;
    const dateFormat = isDateTime ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD";
    const rawValue =
      typeof filter.value === "string" ? filter.value : undefined;
    const summary = formatShortValue(rawValue) || "选择时间";

    const parseDate = (value?: string): Dayjs | null => {
      if (!value) return null;

      const parsed = dayjs(value);
      if (parsed.isValid()) return parsed;

      if (isDateTime) {
        const fallback = dayjs(value.replace(" ", "T"));
        if (fallback.isValid()) return fallback;
      }

      return null;
    };

    return renderCompactPopoverTrigger(
      summary,
      <DatePicker
        size="small"
        className={styles.popoverField}
        showTime={isDateTime ? { format: "HH:mm:ss" } : false}
        value={parseDate(rawValue)}
        format={dateFormat}
        onChange={(date) =>
          onUpdate(filter.id, {
            value: date ? date.format(dateFormat) : undefined,
          })
        }
      />,
    );
  };

  const renderNumberRangeInput = () => {
    const rangeValue = (filter.value as { low?: number; high?: number }) || {};

    const low = toSafeNumber(rangeValue.low);
    const high = toSafeNumber(rangeValue.high);
    const summary = `${low ?? "-"} ~ ${high ?? "-"}`;

    return renderCompactPopoverTrigger(
      summary,
      <Space direction="vertical" size={8} className={styles.popoverField}>
        <InputNumber
          size="small"
          className={styles.popoverField}
          value={low}
          onChange={(value) => handleRangeChange("low", value)}
          placeholder="最小"
        />
        <InputNumber
          size="small"
          className={styles.popoverField}
          value={high}
          onChange={(value) => handleRangeChange("high", value)}
          placeholder="最大"
        />
      </Space>,
    );
  };

  const renderRangeInput = () => {
    if (!isRangeValue) return null;

    if (
      filter.fieldType === FieldType.DATE ||
      filter.fieldType === FieldType.DATETIME
    ) {
      return renderDateRangeInput();
    }

    return renderNumberRangeInput();
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
      const unit = TIME_RANGE_UNIT_MAP[filter.op] ?? "";
      return (
        <div className={styles.timeRange}>
          <InputNumber
            size="small"
            className={styles.inlineNumber}
            min={1}
            value={toSafeNumber(filter.value)}
            onChange={handleNumberValueChange}
            placeholder="N"
          />
          <span className={styles.timeUnit}>{unit}</span>
        </div>
      );
    }

    switch (filter.fieldType) {
      case FieldType.NUMBER:
      case FieldType.DECIMAL:
        return (
          <InputNumber
            size="small"
            className={styles.valueControl}
            value={toSafeNumber(filter.value)}
            onChange={handleNumberValueChange}
            placeholder="数值"
          />
        );

      case FieldType.BOOLEAN: {
        const booleanValue =
          filter.value === true
            ? "true"
            : filter.value === false
              ? "false"
              : (filter.value as string | undefined);

        return (
          <Select
            size="small"
            className={styles.valueControl}
            value={booleanValue}
            onChange={(value) =>
              onUpdate(filter.id, { value: value ?? undefined })
            }
            options={[
              { value: "true", label: "是" },
              { value: "false", label: "否" },
            ]}
            placeholder="请选择"
            allowClear
          />
        );
      }

      case FieldType.DATE:
        return renderSingleDateInput();

      case FieldType.DATETIME:
        return renderSingleDateInput();

      default:
        return (
          <Input
            type="text"
            size="small"
            className={styles.valueControl}
            value={(filter.value as string | undefined) ?? ""}
            onChange={handleTextValueChange}
            placeholder="输入值"
          />
        );
    }
  };

  const selectedOperatorLabel =
    operators.find((op) => op.value === filter.op)?.label ?? filter.op;
  const valueInput = renderValueInput();

  return (
    <div className={styles.filterItem}>
      <Tooltip title={filter.name}>
        <span className={styles.name}>{filter.name}</span>
      </Tooltip>

      <div className={styles.controls}>
        <Select
          size="small"
          className={styles.operatorSelect}
          value={filter.op}
          onChange={(value) =>
            onUpdate(filter.id, { op: value, value: undefined })
          }
          options={operatorOptions}
          popupMatchSelectWidth={false}
          title={selectedOperatorLabel}
        />
        {valueInput ? <div className={styles.valueWrapper}>{valueInput}</div> : null}
      </div>

      <Button
        type="text"
        size="small"
        className={styles.removeBtn}
        icon={<X size={12} />}
        onClick={() => onRemove(filter.id)}
      />
    </div>
  );
};
