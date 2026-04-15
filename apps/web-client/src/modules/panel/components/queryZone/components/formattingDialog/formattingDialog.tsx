import { Dialog } from "@base-ui/react";
import type {
  PanelFormattingRole,
  PanelSimpleFormattingRule,
} from "#pkg/seedar/types";
import { useEffect, useMemo, useState } from "react";
import styles from "./formattingDialog.module.scss";

const KIND_OPTIONS: Array<{
  value: PanelSimpleFormattingRule["kind"];
  label: string;
}> = [
  { value: "number", label: "数字" },
  { value: "percent", label: "百分比" },
  { value: "currency", label: "货币" },
  { value: "date", label: "日期" },
  { value: "datetime", label: "日期时间" },
];

interface FormattingDialogProps {
  open: boolean;
  role: PanelFormattingRole;
  targetLabel: string;
  initialRule?: PanelSimpleFormattingRule;
  onClose: () => void;
  onSave: (rule: Omit<PanelSimpleFormattingRule, "id" | "target" | "role">) => void;
  onRemove: () => void;
}

export const FormattingDialog = ({
  open,
  role,
  targetLabel,
  initialRule,
  onClose,
  onSave,
  onRemove,
}: FormattingDialogProps) => {
  const [kind, setKind] = useState<PanelSimpleFormattingRule["kind"]>("number");
  const [decimals, setDecimals] = useState<string>("");
  const [currency, setCurrency] = useState<string>("CNY");
  const [useGrouping, setUseGrouping] = useState<boolean>(true);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [percentInput, setPercentInput] = useState<"ratio" | "percent">("ratio");

  useEffect(() => {
    if (!open) {
      return;
    }

    setKind(initialRule?.kind || "number");
    setDecimals(
      initialRule?.decimals === undefined ? "" : String(initialRule.decimals),
    );
    setCurrency(initialRule?.currency || "CNY");
    setUseGrouping(initialRule?.useGrouping ?? true);
    setEnabled(initialRule?.enabled !== false);
    setPercentInput(initialRule?.percentInput || "ratio");
  }, [initialRule, open]);

  const isDecimalVisible = useMemo(
    () => kind === "number" || kind === "percent" || kind === "currency",
    [kind],
  );

  const isCurrencyVisible = kind === "currency";
  const isPercentInputVisible = kind === "percent";
  const hasRule = Boolean(initialRule);

  const handleSave = () => {
    const parsedDecimals = decimals.trim().length
      ? Number.parseInt(decimals, 10)
      : undefined;

    onSave({
      enabled,
      kind,
      decimals: Number.isNaN(parsedDecimals) ? undefined : parsedDecimals,
      currency: isCurrencyVisible ? currency || "CNY" : undefined,
      useGrouping: isDecimalVisible ? useGrouping : undefined,
      percentInput: isPercentInputVisible ? percentInput : undefined,
    });
  };

  const roleLabel = role === "metric" ? "指标" : "维度";

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.overlay} />
        <Dialog.Popup className={styles.container}>
          <Dialog.Title className={styles.header}>
            格式化配置
          </Dialog.Title>
          <Dialog.Description className={styles.subHeader}>
            {roleLabel}：{targetLabel}
          </Dialog.Description>

          <div className={styles.content}>
            <label className={styles.row}>
              <span className={styles.label}>启用格式化</span>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
              />
            </label>

            <label className={styles.row}>
              <span className={styles.label}>格式类型</span>
              <select
                className={styles.select}
                value={kind}
                onChange={(event) =>
                  setKind(event.target.value as PanelSimpleFormattingRule["kind"])
                }
              >
                {KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {isPercentInputVisible ? (
              <label className={styles.row}>
                <span className={styles.label}>百分比输入</span>
                <select
                  className={styles.select}
                  value={percentInput}
                  onChange={(event) =>
                    setPercentInput(event.target.value as "ratio" | "percent")
                  }
                >
                  <option value="ratio">小数（0.12）</option>
                  <option value="percent">百分数（12）</option>
                </select>
              </label>
            ) : null}

            {isDecimalVisible ? (
              <label className={styles.row}>
                <span className={styles.label}>小数位</span>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  max={12}
                  value={decimals}
                  onChange={(event) => setDecimals(event.target.value)}
                  placeholder="留空则不强制"
                />
              </label>
            ) : null}

            {isCurrencyVisible ? (
              <label className={styles.row}>
                <span className={styles.label}>货币代码</span>
                <input
                  className={styles.input}
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value.trim().toUpperCase())}
                  placeholder="CNY / USD"
                />
              </label>
            ) : null}

            {isDecimalVisible ? (
              <label className={styles.row}>
                <span className={styles.label}>千分位</span>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={useGrouping}
                  onChange={(event) => setUseGrouping(event.target.checked)}
                />
              </label>
            ) : null}
          </div>

          <div className={styles.footer}>
            {hasRule ? (
              <button
                type="button"
                className={styles.removeButton}
                onClick={onRemove}
              >
                清除格式化
              </button>
            ) : (
              <span />
            )}
            <div className={styles.footerActions}>
              <button type="button" className={styles.cancelButton} onClick={onClose}>
                取消
              </button>
              <button type="button" className={styles.saveButton} onClick={handleSave}>
                保存
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

