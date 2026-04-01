import type { DatasetFormData } from "../../../../types/editor.types";
import styles from "./MetricConfigStep.module.scss";

interface MetricConfigStepProps {
  formData: DatasetFormData;
}

export const MetricConfigStep = ({ formData }: MetricConfigStepProps) => {
  const isWideTable = formData.type === "wideTable";

  if (isWideTable) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>宽表型数据集不支持指标配置</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>指标配置</h3>
      </div>

      <div className={styles.emptyState}>
        <p className={styles.emptyText}>
          请在完成数据集创建/编辑后，进入数据集详情页配置指标
        </p>
      </div>
    </div>
  );
};
