import { FieldType } from "#pkg/seedar/types";

export interface FilterItem {
  id: string | number;
  fieldId: number;
  name: string;
  fieldType: FieldType;
  op: string;
  value?: unknown;
}

export interface OperatorOption {
  value: string;
  label: string;
}

export const OPERATORS_BY_TYPE: Record<FieldType, OperatorOption[]> = {
  [FieldType.STRING]: [
    { value: "=", label: "等于" },
    { value: "!=", label: "不等于" },
    { value: "like", label: "包含" },
    { value: "not_like", label: "不包含" },
    { value: "in", label: "属于" },
    { value: "not_in", label: "不属于" },
    { value: "between", label: "介于" },
    { value: "not_between", label: "不介于" },
    { value: "is_null", label: "为空" },
    { value: "is_not_null", label: "不为空" },
  ],
  [FieldType.NUMBER]: [
    { value: "=", label: "等于" },
    { value: "!=", label: "不等于" },
    { value: ">", label: "大于" },
    { value: "<", label: "小于" },
    { value: ">=", label: "大于等于" },
    { value: "<=", label: "小于等于" },
    { value: "between", label: "介于" },
    { value: "not_between", label: "不介于" },
    { value: "is_null", label: "为空" },
    { value: "is_not_null", label: "不为空" },
  ],
  [FieldType.DECIMAL]: [
    { value: "=", label: "等于" },
    { value: "!=", label: "不等于" },
    { value: ">", label: "大于" },
    { value: "<", label: "小于" },
    { value: ">=", label: "大于等于" },
    { value: "<=", label: "小于等于" },
    { value: "between", label: "介于" },
    { value: "not_between", label: "不介于" },
    { value: "is_null", label: "为空" },
    { value: "is_not_null", label: "不为空" },
  ],
  [FieldType.BOOLEAN]: [
    { value: "=", label: "等于" },
    { value: "!=", label: "不等于" },
    { value: "is_null", label: "为空" },
    { value: "is_not_null", label: "不为空" },
  ],
  [FieldType.DATE]: [
    { value: "=", label: "等于" },
    { value: "!=", label: "不等于" },
    { value: ">", label: "之后" },
    { value: "<", label: "之前" },
    { value: ">=", label: "不早于" },
    { value: "<=", label: "不晚于" },
    { value: "between", label: "介于" },
    { value: "not_between", label: "不介于" },
    { value: "recent_days", label: "最近N天" },
    { value: "recent_weeks", label: "最近N周" },
    { value: "recent_months", label: "最近N月" },
    { value: "is_null", label: "为空" },
    { value: "is_not_null", label: "不为空" },
  ],
  [FieldType.DATETIME]: [
    { value: "=", label: "等于" },
    { value: "!=", label: "不等于" },
    { value: ">", label: "之后" },
    { value: "<", label: "之前" },
    { value: ">=", label: "不早于" },
    { value: "<=", label: "不晚于" },
    { value: "between", label: "介于" },
    { value: "not_between", label: "不介于" },
    { value: "recent_days", label: "最近N天" },
    { value: "recent_weeks", label: "最近N周" },
    { value: "recent_months", label: "最近N月" },
    { value: "is_null", label: "为空" },
    { value: "is_not_null", label: "不为空" },
  ],
};

export const NO_VALUE_OPERATORS = ["is_null", "is_not_null"];

export const TIME_RANGE_OPERATORS = [
  "recent_days",
  "recent_weeks",
  "recent_months",
];

export const ARRAY_VALUE_OPERATORS = ["in", "not_in"];

export const RANGE_VALUE_OPERATORS = ["between", "not_between"];
