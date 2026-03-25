import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useUpdateDataset } from "#pkg/seedar/ui-react";
import { AddMetric } from "#pkg/seedar/types";
import styles from "./metricEditorDialog.module.scss";
import { FormulaEditor } from "./FormulaEditor";
import { useFormulaParser } from "./useFormulaParser";

interface MetricEditorDialogProps {
  datasetId: number;
  fields: { id: number; name: string; businessName?: string }[];
  metrics: { id: number; name: string; businessName?: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export const MetricEditorDialog: React.FC<MetricEditorDialogProps> = ({
  datasetId,
  fields,
  metrics,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [expression, setExpression] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const { toStorage } = useFormulaParser({
    fields: fields as any,
    metrics: metrics as any,
  });

  const { mutate: updateDataset } = useUpdateDataset();

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError("指标名称为必填项");
      return false;
    }

    if (!expression.trim()) {
      setError("请输入公式表达式");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    setError(undefined);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const storageExpression = toStorage(expression);

    const metricData: AddMetric = {
      name,
      businessName: businessName || undefined,
      description: description || undefined,
      expression: storageExpression,
    };

    updateDataset(
      {
        dataSetId: datasetId,
        metrics: {
          added: [metricData],
        },
      },
      {
        onSuccess: () => {
          setIsSubmitting(false);
          onSuccess();
        },
        onError: (err) => {
          setIsSubmitting(false);
          setError(err.message || "创建指标失败");
        },
      },
    );
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <div className={styles.content}>
            <Dialog.Title className={styles.title}>创建指标</Dialog.Title>
            <Dialog.Description className={styles.description}>
              请填写指标信息
            </Dialog.Description>

            <div className={styles.form}>
              <div className={styles.mainContent}>
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>基础信息</h3>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        指标名称 <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        className={styles.input}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="请输入指标名称"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>业务名称</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="请输入业务名称（可选）"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>描述</label>
                    <textarea
                      className={styles.textarea}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="请输入描述（可选）"
                    />
                  </div>
                </div>
                <div className={styles.formulaSection}>
                  <FormulaEditor
                    fields={fields as any}
                    metrics={metrics as any}
                    value={expression}
                    onChange={setExpression}
                  />
                </div>
              </div>
              {error && <div className={styles.errorText}>{error}</div>}

              <div className={styles.actions}>
                <button className={styles.cancelButton} onClick={onClose}>
                  取消
                </button>
                <button
                  className={styles.saveButton}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "创建中..." : "创建"}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
