import { ScrollText, GitMerge, List, BarChart3 } from "lucide-react";
import type { DatasetFormData } from "../../../types/editor.types";
import styles from "./ConfirmStep.module.scss";

interface ConfirmStepProps {
  formData: DatasetFormData;
  isSubmitting?: boolean;
}

export const ConfirmStep = ({ formData, isSubmitting }: ConfirmStepProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>确认配置</h3>
        <p className={styles.hint}>
          请确认以下配置信息，确认无误后点击创建按钮完成操作
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <ScrollText size={16} />
          <h4>基本信息</h4>
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>名称</span>
            <span className={styles.infoValue}>{formData.name || "-"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>描述</span>
            <span className={styles.infoValue}>
              {formData.description || "-"}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>类型</span>
            <span className={styles.infoValue}>
              {formData.type === "semantic" ? "语义型" : "宽表型"}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <List size={16} />
          <h4>数据源与表</h4>
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>数据源ID</span>
            <span className={styles.infoValue}>
              {formData.datasourceId || "-"}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>表数量</span>
            <span className={styles.infoValue}>
              {formData.tables.length}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>主表</span>
            <span className={styles.infoValue}>
              {formData.tables.find((t) => t.tableId === formData.mainTable)
                ?.tableName || "-"}
            </span>
          </div>
        </div>
        {formData.tables.length > 0 && (
          <div className={styles.tagList}>
            {formData.tables.map((table) => (
              <span key={table.tableId} className={styles.tag}>
                {table.tableName}
              </span>
            ))}
          </div>
        )}
      </div>

      {formData.type === "semantic" && (
        <>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <GitMerge size={16} />
              <h4>关联关系</h4>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>关联数量</span>
                <span className={styles.infoValue}>
                  {formData.joins.length}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <BarChart3 size={16} />
              <h4>指标</h4>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>指标数量</span>
                <span className={styles.infoValue}>
                  {formData.metrics.length}
                </span>
              </div>
            </div>
            {formData.metrics.length > 0 && (
              <div className={styles.metricList}>
                {formData.metrics.map((metric) => (
                  <div key={metric.id} className={styles.metricItem}>
                    <span className={styles.metricName}>{metric.name}</span>
                    <span className={styles.metricExpr}>
                      {metric.expression}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <List size={16} />
          <h4>字段</h4>
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>已选字段</span>
            <span className={styles.infoValue}>{formData.fields.length}</span>
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className={styles.submittingOverlay}>
          <div className={styles.spinner} />
          <span>正在创建数据集...</span>
        </div>
      )}
    </div>
  );
};