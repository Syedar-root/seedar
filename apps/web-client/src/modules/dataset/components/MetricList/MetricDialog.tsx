import { useState, useEffect } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  DatasetFieldResponse,
  DatasetMetricResponse,
  MetricType,
} from "#pkg/seedar/types";
import styles from "./MetricDialog.module.scss";
import { FormulaEditor } from "./FormulaEditor";
import { useFormulaParser } from "./useFormulaParser";

interface MetricDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (metric: DatasetMetricResponse) => void;
  fields: DatasetFieldResponse[];
  metrics: DatasetMetricResponse[];
  editMetric?: DatasetMetricResponse;
}

export const MetricDialog: React.FC<MetricDialogProps> = ({
  open,
  onClose,
  onSave,
  fields,
  metrics,
  editMetric,
}) => {
  const [name, setName] = useState(editMetric?.name || "");
  const [businessName, setBusinessName] = useState(
    editMetric?.businessName || "",
  );
  const [description, setDescription] = useState(editMetric?.description || "");
  const [expression, setExpression] = useState(editMetric?.expression || "");
  const [error, setError] = useState<string | undefined>();

  const { toStorage } = useFormulaParser({
    fields: fields.map((f) => ({
      id: f.id,
      name: f.name,
      businessName: f.businessName,
    })),
    metrics: metrics.map((m) => ({
      id: m.id,
      name: m.name,
      businessName: m.businessName,
    })),
  });

  const isEditMode = !!editMetric;

  useEffect(() => {
    if (editMetric) {
      setName(editMetric.name || "");
      setBusinessName(editMetric.businessName || "");
      setDescription(editMetric.description || "");
      setExpression(editMetric.expression || "");
    } else {
      setName("");
      setBusinessName("");
      setDescription("");
      setExpression("");
    }
    setError(undefined);
  }, [editMetric, open]);

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

    const storageExpression = toStorage(expression);

    const metricData: DatasetMetricResponse = {
      id: editMetric?.id || 0,
      name,
      businessName: businessName || undefined,
      description: description || undefined,
      expression: storageExpression,
      alias: businessName || name,
      metricType: MetricType.AGGREGATE,
      distinct: editMetric?.distinct || false,
    };

    onSave(metricData);
    onClose();
  };

  const handleClose = () => {
    setError(undefined);
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog.Root open onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <div className={styles.content}>
            <Dialog.Title className={styles.title}>
              {isEditMode ? "编辑指标" : "创建指标"}
            </Dialog.Title>
            <Dialog.Description className={styles.description}>
              {isEditMode ? "修改指标信息" : "请填写指标信息"}
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
                    fields={fields.map((f) => ({
                      id: f.id,
                      name: f.name,
                      businessName: f.businessName,
                      tableName: f.tableName,
                    }))}
                    metrics={metrics.map((m) => ({
                      id: m.id,
                      name: m.name,
                      businessName: m.businessName,
                    }))}
                    value={expression}
                    onChange={setExpression}
                  />
                </div>
              </div>
              {error && <div className={styles.errorText}>{error}</div>}

              <div className={styles.actions}>
                <button className={styles.cancelButton} onClick={handleClose}>
                  取消
                </button>
                <button className={styles.saveButton} onClick={handleSubmit}>
                  {isEditMode ? "保存" : "创建"}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
