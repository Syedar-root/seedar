import type { DatasetFormData } from "../../../types/editor.types";
import styles from "./BasicInfoStep.module.scss";

interface BasicInfoStepProps {
  formData: DatasetFormData;
  onUpdate: (updates: Partial<DatasetFormData>) => void;
}

export const BasicInfoStep = ({ formData, onUpdate }: BasicInfoStepProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.field}>
        <label className={styles.label}>
          数据集名称 <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          className={styles.input}
          value={formData.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="请输入数据集名称"
          maxLength={100}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>描述</label>
        <textarea
          className={styles.textarea}
          value={formData.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="请输入数据集描述（可选）"
          rows={3}
          maxLength={500}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          数据集类型 <span className={styles.required}>*</span>
        </label>
        <select
          className={styles.select}
          value={formData.type}
          onChange={(e) =>
            onUpdate({ type: e.target.value as "semantic" | "wideTable" })
          }
        >
          <option value="semantic">语义型</option>
          <option value="wideTable">宽表型</option>
        </select>
        <p className={styles.hint}>
          {formData.type === "semantic"
            ? "语义型数据集支持指标配置和关联关系"
            : "宽表型数据集适用于大规模数据分析"}
        </p>
      </div>
    </div>
  );
};