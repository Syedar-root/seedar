import { Dialog } from "@base-ui/react";
import { Select } from "@/core/components/ui/Select";
import type { DatasetFieldResponse } from "#pkg/seedar/types";
import { Tooltip } from "antd";
import { CircleHelp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  DerivedDimensionInput,
  DimensionItem,
} from "../../../../hooks/usePanelEditorState";
import styles from "./derivedDimensionDialog.module.scss";

type DerivedKind = DerivedDimensionInput["derivedKind"];

type BucketRow = {
  lt: string;
  label: string;
};

type MappingRow = {
  values: string;
  label: string;
};

interface DerivedDimensionDialogProps {
  open: boolean;
  availableFields: DatasetFieldResponse[];
  existingDimensions: DimensionItem[];
  initialDimension?: DimensionItem;
  preferredFieldId?: number;
  preferredFieldLabel?: string;
  onClose: () => void;
  onSave: (dimension: DerivedDimensionInput) => void;
}

const DEFAULT_BUCKET_ROW: BucketRow = { lt: "", label: "" };
const DEFAULT_MAPPING_ROW: MappingRow = { values: "", label: "" };
const VALID_TIME_FIELD_TYPES = new Set(["date", "datetime"]);

const KIND_OPTIONS: Array<{ label: string; value: DerivedKind }> = [
  { label: "时间粒度", value: "time_grain" },
  { label: "分段", value: "bucket" },
  { label: "映射", value: "mapping" },
  { label: "表达式", value: "expression" },
];

const GRAIN_OPTIONS = [
  { label: "天", value: "day" },
  { label: "周", value: "week" },
  { label: "月", value: "month" },
  { label: "季", value: "quarter" },
  { label: "年", value: "year" },
] as const;

const parseMappingValue = (token: string): string | number | boolean => {
  const normalized = token.trim();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    return Number(normalized);
  }
  return normalized;
};

const LabelWithHint = ({
  label,
  tip,
  required,
}: {
  label: string;
  tip?: string;
  required?: boolean;
}) => (
  <label className={styles.formLabel}>
    <span className={styles.labelRow}>
      {label}
      {required ? <span className={styles.required}>*</span> : null}
      {tip ? (
        <Tooltip title={tip}>
          <span className={styles.hintIcon}>
            <CircleHelp size={14} />
          </span>
        </Tooltip>
      ) : null}
    </span>
  </label>
);

export const DerivedDimensionDialog: React.FC<DerivedDimensionDialogProps> = ({
  open,
  availableFields,
  existingDimensions,
  initialDimension,
  preferredFieldId,
  preferredFieldLabel,
  onClose,
  onSave,
}) => {
  const initialDsl = useMemo(() => {
    if (!initialDimension?.isDerived) {
      return undefined;
    }
    return initialDimension.dimensionDsl as DerivedDimensionInput;
  }, [initialDimension]);

  const derivedFieldId = useMemo(() => {
    if (!initialDsl || !("fieldId" in initialDsl)) {
      return undefined;
    }
    return initialDsl.fieldId;
  }, [initialDsl]);

  const [kind, setKind] = useState<DerivedKind>("time_grain");
  const [alias, setAlias] = useState("");
  const [grain, setGrain] = useState<(typeof GRAIN_OPTIONS)[number]["value"]>(
    "month",
  );
  const [bucketRows, setBucketRows] = useState<BucketRow[]>([
    DEFAULT_BUCKET_ROW,
  ]);
  const [mappingRows, setMappingRows] = useState<MappingRow[]>([
    DEFAULT_MAPPING_ROW,
  ]);
  const [defaultLabel, setDefaultLabel] = useState("");
  const [expression, setExpression] = useState("");
  const [error, setError] = useState<string>();

  const preferredField = useMemo(
    () => availableFields.find((field) => field.id === preferredFieldId),
    [availableFields, preferredFieldId],
  );

  const fieldContextAvailable =
    preferredFieldId !== undefined || derivedFieldId !== undefined;

  const availableKindOptions = useMemo(() => {
    if (fieldContextAvailable) {
      return KIND_OPTIONS;
    }
    return KIND_OPTIONS.filter((option) => option.value === "expression");
  }, [fieldContextAvailable]);

  const lockedFieldId = useMemo(() => {
    if (kind === "expression") {
      return undefined;
    }
    if (preferredFieldId !== undefined) {
      return preferredFieldId;
    }
    return derivedFieldId;
  }, [derivedFieldId, kind, preferredFieldId]);

  const lockedFieldLabel = useMemo(() => {
    if (lockedFieldId === undefined) {
      return undefined;
    }
    const matched = availableFields.find((field) => field.id === lockedFieldId);
    return preferredFieldLabel || matched?.businessName || matched?.name;
  }, [availableFields, lockedFieldId, preferredFieldLabel]);

  const existingAliases = useMemo(() => {
    const currentId = initialDimension?.id;
    return existingDimensions
      .filter((dimension) => dimension.id !== currentId)
      .map((dimension) => (dimension.businessName || dimension.name).trim())
      .filter(Boolean);
  }, [existingDimensions, initialDimension?.id]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!initialDsl) {
      const canUseTimeGrain = Boolean(
        preferredField && VALID_TIME_FIELD_TYPES.has(preferredField.type),
      );

      if (!fieldContextAvailable) {
        setKind("expression");
      } else {
        setKind(canUseTimeGrain ? "time_grain" : "bucket");
      }
      setAlias("");
      setGrain("month");
      setBucketRows([DEFAULT_BUCKET_ROW]);
      setMappingRows([DEFAULT_MAPPING_ROW]);
      setDefaultLabel("");
      setExpression("");
      setError(undefined);
      return;
    }

    const nextKind =
      !fieldContextAvailable && initialDsl.derivedKind !== "expression"
        ? "expression"
        : initialDsl.derivedKind;

    setKind(nextKind);
    setAlias(initialDsl.alias);
    setError(undefined);

    if (initialDsl.derivedKind === "time_grain") {
      setGrain(initialDsl.grain);
      setBucketRows([DEFAULT_BUCKET_ROW]);
      setMappingRows([DEFAULT_MAPPING_ROW]);
      setDefaultLabel("");
      setExpression("");
      return;
    }

    if (initialDsl.derivedKind === "bucket") {
      setBucketRows(
        initialDsl.ranges.map((row) => ({
          lt: String(row.lt),
          label: row.label,
        })),
      );
      setDefaultLabel(initialDsl.defaultLabel || "");
      setMappingRows([DEFAULT_MAPPING_ROW]);
      setExpression("");
      return;
    }

    if (initialDsl.derivedKind === "mapping") {
      setMappingRows(
        initialDsl.rules.map((row) => ({
          values: row.in.map((value) => String(value)).join(", "),
          label: row.label,
        })),
      );
      setDefaultLabel(initialDsl.defaultLabel || "");
      setBucketRows([DEFAULT_BUCKET_ROW]);
      setExpression("");
      return;
    }

    setExpression(initialDsl.expression);
    setBucketRows([DEFAULT_BUCKET_ROW]);
    setMappingRows([DEFAULT_MAPPING_ROW]);
    setDefaultLabel("");
  }, [
    fieldContextAvailable,
    initialDsl,
    open,
    preferredField,
  ]);

  const aliasPlaceholder =
    kind === "time_grain"
      ? "例如：订单日期_月"
      : kind === "bucket"
        ? "例如：金额分段"
        : kind === "mapping"
          ? "例如：状态映射"
          : "例如：订单等级";

  const validate = (): DerivedDimensionInput | undefined => {
    const nextAlias = alias.trim();
    if (!nextAlias) {
      setError("别名为必填项");
      return undefined;
    }

    if (existingAliases.includes(nextAlias)) {
      setError("别名已存在，请更换");
      return undefined;
    }

    if (kind === "expression") {
      const nextExpression = expression.trim();
      if (!nextExpression) {
        setError("表达式不能为空");
        return undefined;
      }
      if (/#M\d+/i.test(nextExpression)) {
        setError("表达式衍生维度不支持 #M 指标引用");
        return undefined;
      }
      return {
        derivedKind: "expression",
        expression: nextExpression,
        alias: nextAlias,
      };
    }

    if (lockedFieldId === undefined) {
      setError("当前维度缺少字段上下文，请从具体维度项发起配置");
      return undefined;
    }

    if (kind === "time_grain") {
      return {
        derivedKind: "time_grain",
        fieldId: lockedFieldId,
        grain,
        alias: nextAlias,
      };
    }

    if (kind === "bucket") {
      const ranges = bucketRows
        .map((row) => {
          const lt = Number(row.lt);
          const label = row.label.trim();
          if (!row.lt || Number.isNaN(lt) || !label) {
            return undefined;
          }
          return { lt, label };
        })
        .filter(
          (
            row,
          ): row is {
            lt: number;
            label: string;
          } => Boolean(row),
        );

      if (ranges.length === 0) {
        setError("请至少配置一个有效分段");
        return undefined;
      }

      return {
        derivedKind: "bucket",
        fieldId: lockedFieldId,
        ranges,
        defaultLabel: defaultLabel.trim() || undefined,
        alias: nextAlias,
      };
    }

    const rules = mappingRows
      .map((row) => {
        const label = row.label.trim();
        const values = row.values
          .split(",")
          .map((token) => token.trim())
          .filter(Boolean)
          .map(parseMappingValue);

        if (!label || values.length === 0) {
          return undefined;
        }

        return {
          in: values,
          label,
        };
      })
      .filter(
        (
          row,
        ): row is {
          in: Array<string | number | boolean>;
          label: string;
        } => Boolean(row),
      );

    if (rules.length === 0) {
      setError("请至少配置一条有效映射规则");
      return undefined;
    }

    return {
      derivedKind: "mapping",
      fieldId: lockedFieldId,
      rules,
      defaultLabel: defaultLabel.trim() || undefined,
      alias: nextAlias,
    };
  };

  const handleSave = () => {
    setError(undefined);
    const next = validate();
    if (!next) {
      return;
    }
    onSave(next);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.overlay} />
        <Dialog.Popup className={styles.container}>
          <Dialog.Title className={styles.header}>
            {initialDsl ? "编辑衍生维度" : "新增衍生维度"}
          </Dialog.Title>
          <Dialog.Description className={styles.content}>
            <div className={styles.formGroup}>
              <LabelWithHint
                label="类型"
                required
                tip="时间粒度：按日/周/月等聚合；分段：阈值划分；映射：值到标签；表达式：自定义公式。"
              />
              <Select
                value={kind}
                onChange={(value) => setKind((value as DerivedKind) || "time_grain")}
                className={styles.selectControl}
                options={availableKindOptions.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
                clearable={false}
              />
            </div>

            <div className={styles.formGroup}>
              <LabelWithHint
                label="别名"
                required
                tip="用于查询结果列名与图表字段映射，建议语义清晰且唯一。"
              />
              <input
                className={styles.input}
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                placeholder={aliasPlaceholder}
              />
            </div>

            {kind !== "expression" ? (
              <div className={styles.formGroup}>
                <LabelWithHint
                  label="字段"
                  required
                  tip="字段来自你点击的维度项，已自动绑定。"
                />
                <div className={styles.lockedField}>
                  {lockedFieldLabel || "字段上下文未识别"}
                </div>
              </div>
            ) : null}

            {kind === "time_grain" ? (
              <div className={styles.formGroup}>
                <LabelWithHint
                  label="粒度"
                  required
                  tip="选择按什么时间单位分组。"
                />
                <Select
                  value={grain}
                  onChange={(value) =>
                    setGrain(
                      (value as (typeof GRAIN_OPTIONS)[number]["value"]) ||
                        "month",
                    )
                  }
                  className={styles.selectControl}
                  options={GRAIN_OPTIONS.map((option) => ({
                    label: option.label,
                    value: option.value,
                  }))}
                  clearable={false}
                />
              </div>
            ) : null}

            {kind === "bucket" ? (
              <>
                <div className={styles.formGroup}>
                  <LabelWithHint
                    label="分段规则"
                    required
                    tip="按顺序匹配：字段值 < 阈值 时命中对应标签。"
                  />
                  <div className={styles.ruleList}>
                    {bucketRows.map((row, index) => (
                      <div className={styles.ruleRow} key={`bucket_${index}`}>
                        <input
                          className={styles.input}
                          value={row.lt}
                          onChange={(event) => {
                            const nextRows = [...bucketRows];
                            nextRows[index] = {
                              ...nextRows[index],
                              lt: event.target.value,
                            };
                            setBucketRows(nextRows);
                          }}
                          placeholder="阈值（如 100）"
                        />
                        <input
                          className={styles.input}
                          value={row.label}
                          onChange={(event) => {
                            const nextRows = [...bucketRows];
                            nextRows[index] = {
                              ...nextRows[index],
                              label: event.target.value,
                            };
                            setBucketRows(nextRows);
                          }}
                          placeholder="命中后展示名（如 低）"
                        />
                        <button
                          type="button"
                          className={styles.inlineAction}
                          onClick={() =>
                            setBucketRows((current) =>
                              current.length <= 1
                                ? current
                                : current.filter((_, currentIndex) => currentIndex !== index),
                            )
                          }
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.addRuleButton}
                    onClick={() =>
                      setBucketRows((current) => [...current, DEFAULT_BUCKET_ROW])
                    }
                  >
                    新增分段
                  </button>
                </div>
                <div className={styles.formGroup}>
                  <LabelWithHint
                    label="默认标签"
                    tip="当所有分段都未命中时使用，不填则返回 NULL。"
                  />
                  <input
                    className={styles.input}
                    value={defaultLabel}
                    onChange={(event) => setDefaultLabel(event.target.value)}
                    placeholder="未命中时展示（如 其他）"
                  />
                </div>
              </>
            ) : null}

            {kind === "mapping" ? (
              <>
                <div className={styles.formGroup}>
                  <LabelWithHint
                    label="映射规则"
                    required
                    tip="同一行支持多个匹配值，逗号分隔；匹配后输出对应标签。"
                  />
                  <div className={styles.ruleList}>
                    {mappingRows.map((row, index) => (
                      <div className={styles.ruleRow} key={`mapping_${index}`}>
                        <input
                          className={styles.input}
                          value={row.values}
                          onChange={(event) => {
                            const nextRows = [...mappingRows];
                            nextRows[index] = {
                              ...nextRows[index],
                              values: event.target.value,
                            };
                            setMappingRows(nextRows);
                          }}
                          placeholder="匹配值，逗号分隔（如 paid, shipped）"
                        />
                        <input
                          className={styles.input}
                          value={row.label}
                          onChange={(event) => {
                            const nextRows = [...mappingRows];
                            nextRows[index] = {
                              ...nextRows[index],
                              label: event.target.value,
                            };
                            setMappingRows(nextRows);
                          }}
                          placeholder="展示名（如 已完成）"
                        />
                        <button
                          type="button"
                          className={styles.inlineAction}
                          onClick={() =>
                            setMappingRows((current) =>
                              current.length <= 1
                                ? current
                                : current.filter((_, currentIndex) => currentIndex !== index),
                            )
                          }
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.addRuleButton}
                    onClick={() =>
                      setMappingRows((current) => [...current, DEFAULT_MAPPING_ROW])
                    }
                  >
                    新增规则
                  </button>
                </div>
                <div className={styles.formGroup}>
                  <LabelWithHint
                    label="默认标签"
                    tip="当所有映射规则都未命中时使用，不填则返回 NULL。"
                  />
                  <input
                    className={styles.input}
                    value={defaultLabel}
                    onChange={(event) => setDefaultLabel(event.target.value)}
                    placeholder="未命中时展示（如 其他）"
                  />
                </div>
              </>
            ) : null}

            {kind === "expression" ? (
              <div className={styles.formGroup}>
                <LabelWithHint
                  label="表达式"
                  required
                  tip="仅支持 #F 字段引用，不支持 #M 指标引用。"
                />
                <textarea
                  className={styles.textarea}
                  value={expression}
                  onChange={(event) => setExpression(event.target.value)}
                  placeholder="示例：#F12 == 'paid' ? '已支付' : '未支付'"
                />
              </div>
            ) : null}

            {error ? <div className={styles.errorText}>{error}</div> : null}
          </Dialog.Description>
          <div className={styles.footer}>
            <Dialog.Close className={styles.cancelButton} onClick={onClose}>
              取消
            </Dialog.Close>
            <button
              className={styles.saveButton}
              type="button"
              onClick={handleSave}
            >
              保存
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};