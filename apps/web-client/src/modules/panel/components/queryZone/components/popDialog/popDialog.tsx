import { Dialog } from "@base-ui/react";
import styles from "./popDialog.module.scss";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Select } from "@/core/components/ui/Select";
import {
  FieldType,
  PeriodCalculationMode,
  PeriodOverPeriodType,
  type DatasetFieldResponse,
} from "#pkg/seedar/types";
import { MetricWithPopConfig } from "../../queryZone";
import type { PeriodOverPeriodConfig, TempMetricConfig } from "../../../../types";

const PERIOD_TYPE_OPTIONS = [
  { label: "日环比", value: PeriodOverPeriodType.DAY_OVER_DAY },
  { label: "周环比", value: PeriodOverPeriodType.WEEK_OVER_WEEK },
  { label: "月环比", value: PeriodOverPeriodType.MONTH_OVER_MONTH },
  { label: "季环比", value: PeriodOverPeriodType.QUARTER_OVER_QUARTER },
  { label: "年同比", value: PeriodOverPeriodType.YEAR_OVER_YEAR },
];

const CALCULATION_MODE_OPTIONS = [
  { label: "百分比", value: PeriodCalculationMode.PERCENTAGE },
  { label: "绝对值", value: PeriodCalculationMode.ABSOLUTE },
];

interface PopDialogProps {
  open: boolean;
  metric?: MetricWithPopConfig;
  availableFields: DatasetFieldResponse[];
  initialConfig?: PeriodOverPeriodConfig | TempMetricConfig;
  onClose: () => void;
  onSave: (config: PeriodOverPeriodConfig) => void;
}

export const PopDialog = ({
  open,
  metric,
  availableFields,
  initialConfig,
  onClose,
  onSave,
}: PopDialogProps) => {
  const [periodType, setPeriodType] = useState<string>("");
  const [calculationMode, setCalculationMode] = useState<string>("");
  const [timeFieldId, setTimeFieldId] = useState<string>("");

  const timeFields = useMemo(
    () =>
      availableFields.filter(
        (field) =>
          field.type === FieldType.DATE || field.type === FieldType.DATETIME,
      ),
    [availableFields],
  );

  useEffect(() => {
    if (open) {
      setPeriodType(initialConfig?.periodType || "");
      setCalculationMode(initialConfig?.calculationMode || "");
      const defaultTimeFieldId =
        initialConfig?.timeFieldId ??
        (typeof metric?.timeFieldId === "number" ? metric.timeFieldId : undefined);
      setTimeFieldId(defaultTimeFieldId ? String(defaultTimeFieldId) : "");
    } else {
      setPeriodType("");
      setCalculationMode("");
      setTimeFieldId("");
    }
  }, [initialConfig, metric?.timeFieldId, open]);

  const handleSave = useCallback(() => {
    if (!periodType || !calculationMode || !timeFieldId) {
      return;
    }

    onSave({
      periodType: periodType as PeriodOverPeriodType,
      calculationMode: calculationMode as PeriodCalculationMode,
      timeFieldId: Number(timeFieldId),
    });
  }, [calculationMode, onSave, periodType, timeFieldId]);

  const handleClear = useCallback(() => {
    onSave({
      periodType: undefined,
      calculationMode: undefined,
      timeFieldId: undefined,
    });
  }, [onSave]);

  if (!metric) return null;

  const isEditMode =
    !!initialConfig?.periodType &&
    !!initialConfig?.calculationMode &&
    !!initialConfig?.timeFieldId;
  const canSave = !!periodType && !!calculationMode && !!timeFieldId;

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.overlay} />
        <Dialog.Popup className={styles.container}>
          <Dialog.Title className={styles.header}>
            {isEditMode ? "编辑同环比" : "配置同环比"} -{" "}
            {metric.businessName || metric.name}
          </Dialog.Title>
          <Dialog.Description className={styles.content}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                周期类型 <span className={styles.required}>*</span>
              </label>
              <Select
                value={periodType}
                onChange={(value) => setPeriodType(value || "")}
                placeholder="请选择周期类型"
                options={PERIOD_TYPE_OPTIONS}
                clearable={false}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                计算模式 <span className={styles.required}>*</span>
              </label>
              <Select
                value={calculationMode}
                onChange={(value) => setCalculationMode(value || "")}
                placeholder="请选择计算模式"
                options={CALCULATION_MODE_OPTIONS}
                clearable={false}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                业务时间字段 <span className={styles.required}>*</span>
              </label>
              <Select
                value={timeFieldId}
                onChange={(value) => setTimeFieldId(value || "")}
                placeholder="请选择业务时间字段"
                options={timeFields.map((field) => ({
                  label: (
                    <span className={styles.fieldOptionLabel}>
                      <span>{field.businessName || field.name}</span>
                      <span className={styles.fieldOptionTable}>
                        来自: {field.tableName || "未知表"}
                      </span>
                    </span>
                  ),
                  value: field.id.toString(),
                }))}
                clearable={false}
              />
            </div>
          </Dialog.Description>
          <div className={styles.footer}>
            {isEditMode && (
              <button
                className={styles.clearButton}
                onClick={handleClear}
                type="button"
              >
                清除配置
              </button>
            )}
            <div className={styles.footerRight}>
              <Dialog.Close className={styles.cancelButton} onClick={onClose}>
                取消
              </Dialog.Close>
              <button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={!canSave}
                type="button"
              >
                保存
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
