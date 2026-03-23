import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useUpdateDataset } from "#pkg/seedar/ui-react";
import {
  DatasetFieldResponse,
  DatasetMetricResponse,
  MetricType,
  MetricAggregateFunction,
  MetricOperator,
  AddMetric,
} from "#pkg/seedar/types";
import styles from "./metricEditorDialog.module.scss";

interface MetricEditorDialogProps {
  datasetId: number;
  fields: DatasetFieldResponse[];
  metrics: DatasetMetricResponse[];
  numericFields: DatasetFieldResponse[];
  onClose: () => void;
  onSuccess: () => void;
}

const METRIC_TYPE_OPTIONS = [
  { value: MetricType.AGGREGATE, label: "聚合指标" },
  { value: MetricType.ROW_LEVEL, label: "行级指标" },
  { value: MetricType.POST_AGGREGATE, label: "后聚合指标" },
  { value: MetricType.ARITHMETIC, label: "算术运算指标" },
];

const AGGREGATE_FUNCTION_OPTIONS = [
  { value: MetricAggregateFunction.SUM, label: "求和 (sum)" },
  { value: MetricAggregateFunction.COUNT, label: "计数 (count)" },
  { value: MetricAggregateFunction.AVG, label: "平均值 (avg)" },
  { value: MetricAggregateFunction.MAX, label: "最大值 (max)" },
  { value: MetricAggregateFunction.MIN, label: "最小值 (min)" },
  { value: MetricAggregateFunction.DISTINCT_COUNT, label: "去重计数 (distinct_count)" },
];

const ARITHMETIC_OPERATOR_OPTIONS = [
  { value: MetricOperator.ADD, label: "加 (+)" },
  { value: MetricOperator.SUBTRACT, label: "减 (-)" },
  { value: MetricOperator.MULTIPLY, label: "乘 (*)" },
  { value: MetricOperator.DIVIDE, label: "除 (/)" },
];

const ROW_OPERATOR_OPTIONS = [
  { value: MetricOperator.ADD, label: "加 (+)" },
  { value: MetricOperator.SUBTRACT, label: "减 (-)" },
  { value: MetricOperator.MULTIPLY, label: "乘 (*)" },
  { value: MetricOperator.DIVIDE, label: "除 (/)" },
];

export const MetricEditorDialog: React.FC<MetricEditorDialogProps> = ({
  datasetId,
  fields,
  metrics,
  numericFields,
  onClose,
  onSuccess,
}) => {
  const [metricType, setMetricType] = useState<MetricType>(MetricType.AGGREGATE);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  
  const [dataSourceColumnId, setDataSourceColumnId] = useState<number | undefined>();
  const [aggregateFunction, setAggregateFunction] = useState<MetricAggregateFunction | undefined>();
  const [distinct, setDistinct] = useState(false);
  const [aggregateCondition, setAggregateCondition] = useState("");
  
  const [leftOperand, setLeftOperand] = useState<number | undefined>();
  const [leftOperandFieldId, setLeftOperandFieldId] = useState<number | undefined>();
  const [rowOperator, setRowOperator] = useState<MetricOperator | undefined>();
  const [rightOperand, setRightOperand] = useState<number | undefined>();
  const [rightOperandFieldId, setRightOperandFieldId] = useState<number | undefined>();
  
  const [sourceMetricId, setSourceMetricId] = useState<number | undefined>();
  
  const [leftMetricId, setLeftMetricId] = useState<number | undefined>();
  const [arithmeticOperator, setArithmeticOperator] = useState<MetricOperator | undefined>();
  const [rightMetricOperand, setRightMetricOperand] = useState<number | undefined>();
  const [rightMetricOperandFieldId, setRightMetricOperandFieldId] = useState<number | undefined>();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const { mutate: updateDataset } = useUpdateDataset();

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError("指标名称为必填项");
      return false;
    }

    if (metricType === MetricType.AGGREGATE) {
      if (!dataSourceColumnId) {
        setError("请选择数据源列");
        return false;
      }
      if (!aggregateFunction) {
        setError("请选择聚合函数");
        return false;
      }
    }

    if (metricType === MetricType.ROW_LEVEL) {
      if (!leftOperand && !leftOperandFieldId) {
        setError("请设置左操作数");
        return false;
      }
      if (!rowOperator) {
        setError("请选择运算符");
        return false;
      }
      if (!rightOperand && !rightOperandFieldId) {
        setError("请设置右操作数");
        return false;
      }
    }

    if (metricType === MetricType.POST_AGGREGATE) {
      if (!sourceMetricId) {
        setError("请选择源指标");
        return false;
      }
    }

    if (metricType === MetricType.ARITHMETIC) {
      if (!leftMetricId) {
        setError("请选择左指标");
        return false;
      }
      if (!arithmeticOperator) {
        setError("请选择运算符");
        return false;
      }
      if (!rightMetricOperand && !rightMetricOperandFieldId) {
        setError("请设置右操作数");
        return false;
      }
    }

    if (aggregateCondition.trim()) {
      try {
        JSON.parse(aggregateCondition);
      } catch {
        setError("聚合条件 JSON 格式不正确");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = () => {
    setError(undefined);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const metricData: AddMetric = {
      metricType,
      name,
      businessName: businessName || undefined,
      description: description || undefined,
    };

    if (metricType === MetricType.AGGREGATE) {
      metricData.dataSourceColumnId = dataSourceColumnId;
      metricData.aggregateFunction = aggregateFunction;
      metricData.distinct = distinct;
      if (aggregateCondition.trim()) {
        metricData.aggregateCondition = JSON.parse(aggregateCondition);
      }
    }

    if (metricType === MetricType.ROW_LEVEL) {
      if (leftOperandFieldId) {
        metricData.leftOperand = undefined;
      } else {
        metricData.leftOperand = leftOperand;
      }
      metricData.rowOperator = rowOperator;
      if (rightOperandFieldId) {
        metricData.rightOperand = undefined;
      } else {
        metricData.rightOperand = rightOperand;
      }
    }

    if (metricType === MetricType.POST_AGGREGATE) {
      metricData.sourceMetricId = sourceMetricId;
    }

    if (metricType === MetricType.ARITHMETIC) {
      metricData.leftMetricId = leftMetricId;
      metricData.arithmeticOperator = arithmeticOperator;
      if (rightMetricOperandFieldId) {
        metricData.rightMetricOperand = undefined;
      } else {
        metricData.rightMetricOperand = rightMetricOperand;
      }
    }

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
      }
    );
  };

  const handleLeftOperandTypeChange = (type: "field" | "value") => {
    if (type === "field") {
      setLeftOperand(undefined);
    } else {
      setLeftOperandFieldId(undefined);
    }
  };

  const handleRightOperandTypeChange = (type: "field" | "value") => {
    if (type === "field") {
      setRightOperand(undefined);
    } else {
      setRightOperandFieldId(undefined);
    }
  };

  const handleRightMetricOperandTypeChange = (type: "metric" | "field" | "value") => {
    if (type === "field") {
      setRightMetricOperand(undefined);
    } else if (type === "metric") {
      setRightMetricOperandFieldId(undefined);
    } else {
      setRightMetricOperandFieldId(undefined);
    }
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
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>基础信息</h3>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    指标类型 <span className={styles.required}>*</span>
                  </label>
                  <select
                    className={styles.selectTrigger}
                    value={metricType}
                    onChange={(e) => setMetricType(e.target.value as MetricType)}
                  >
                    {METRIC_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

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

              {metricType === MetricType.AGGREGATE && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>聚合配置</h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      数据源列 <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={styles.selectTrigger}
                      value={dataSourceColumnId || ""}
                      onChange={(e) => setDataSourceColumnId(Number(e.target.value) || undefined)}
                    >
                      <option value="">请选择字段</option>
                      {numericFields.map((field) => (
                        <option key={field.id} value={field.id}>
                          {field.businessName || field.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      聚合函数 <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={styles.selectTrigger}
                      value={aggregateFunction || ""}
                      onChange={(e) => setAggregateFunction(e.target.value as MetricAggregateFunction || undefined)}
                    >
                      <option value="">请选择聚合函数</option>
                      {AGGREGATE_FUNCTION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={distinct}
                        onChange={(e) => setDistinct(e.target.checked)}
                      />
                      去重
                    </label>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>聚合条件 (JSON)</label>
                    <textarea
                      className={styles.textarea}
                      value={aggregateCondition}
                      onChange={(e) => setAggregateCondition(e.target.value)}
                      placeholder='{"timeFieldId": 1, "timeRange": "recent_days", "timeValue": 7}'
                    />
                  </div>
                </div>
              )}

              {metricType === MetricType.ROW_LEVEL && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>行级运算配置</h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      左操作数 <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.row}>
                      <select
                        className={styles.selectTrigger}
                        value={leftOperandFieldId ? "field" : ""}
                        onChange={(e) => {
                          handleLeftOperandTypeChange(e.target.value as "field" | "value");
                        }}
                      >
                        <option value="">选择类型</option>
                        <option value="field">字段</option>
                        <option value="value">数值</option>
                      </select>
                      {leftOperandFieldId ? (
                        <select
                          className={styles.selectTrigger}
                          value={leftOperandFieldId}
                          onChange={(e) => setLeftOperandFieldId(Number(e.target.value))}
                        >
                          <option value="">选择字段</option>
                          {numericFields.map((field) => (
                            <option key={field.id} value={field.id}>
                              {field.businessName || field.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          className={styles.input}
                          value={leftOperand ?? ""}
                          onChange={(e) => setLeftOperand(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="请输入数值"
                        />
                      )}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      运算符 <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={styles.selectTrigger}
                      value={rowOperator || ""}
                      onChange={(e) => setRowOperator(e.target.value as MetricOperator || undefined)}
                    >
                      <option value="">请选择运算符</option>
                      {ROW_OPERATOR_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      右操作数 <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.row}>
                      <select
                        className={styles.selectTrigger}
                        value={rightOperandFieldId ? "field" : ""}
                        onChange={(e) => {
                          handleRightOperandTypeChange(e.target.value as "field" | "value");
                        }}
                      >
                        <option value="">选择类型</option>
                        <option value="field">字段</option>
                        <option value="value">数值</option>
                      </select>
                      {rightOperandFieldId ? (
                        <select
                          className={styles.selectTrigger}
                          value={rightOperandFieldId}
                          onChange={(e) => setRightOperandFieldId(Number(e.target.value))}
                        >
                          <option value="">选择字段</option>
                          {numericFields.map((field) => (
                            <option key={field.id} value={field.id}>
                              {field.businessName || field.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          className={styles.input}
                          value={rightOperand ?? ""}
                          onChange={(e) => setRightOperand(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="请输入数值"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {metricType === MetricType.POST_AGGREGATE && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>后聚合配置</h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      源指标 <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={styles.selectTrigger}
                      value={sourceMetricId || ""}
                      onChange={(e) => setSourceMetricId(Number(e.target.value) || undefined)}
                    >
                      <option value="">请选择源指标</option>
                      {metrics.map((metric) => (
                        <option key={metric.id} value={metric.id}>
                          {metric.businessName || metric.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {metricType === MetricType.ARITHMETIC && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>算术运算配置</h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      左指标 <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={styles.selectTrigger}
                      value={leftMetricId || ""}
                      onChange={(e) => setLeftMetricId(Number(e.target.value) || undefined)}
                    >
                      <option value="">请选择指标</option>
                      {metrics.map((metric) => (
                        <option key={metric.id} value={metric.id}>
                          {metric.businessName || metric.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      运算符 <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={styles.selectTrigger}
                      value={arithmeticOperator || ""}
                      onChange={(e) => setArithmeticOperator(e.target.value as MetricOperator || undefined)}
                    >
                      <option value="">请选择运算符</option>
                      {ARITHMETIC_OPERATOR_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      右操作数 <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.row}>
                      <select
                        className={styles.selectTrigger}
                        value={rightMetricOperandFieldId ? "field" : rightMetricOperand ? "value" : ""}
                        onChange={(e) => {
                          handleRightMetricOperandTypeChange(e.target.value as "metric" | "field" | "value");
                        }}
                      >
                        <option value="">选择类型</option>
                        <option value="metric">指标</option>
                        <option value="field">字段</option>
                        <option value="value">数值</option>
                      </select>
                      {rightMetricOperandFieldId ? (
                        <select
                          className={styles.selectTrigger}
                          value={rightMetricOperandFieldId}
                          onChange={(e) => setRightMetricOperandFieldId(Number(e.target.value))}
                        >
                          <option value="">选择字段</option>
                          {numericFields.map((field) => (
                            <option key={field.id} value={field.id}>
                              {field.businessName || field.name}
                            </option>
                          ))}
                        </select>
                      ) : rightMetricOperand !== undefined ? (
                        <input
                          type="number"
                          className={styles.input}
                          value={rightMetricOperand ?? ""}
                          onChange={(e) => setRightMetricOperand(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="请输入数值"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

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
