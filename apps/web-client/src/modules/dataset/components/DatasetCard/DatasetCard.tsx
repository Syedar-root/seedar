import { Database, Trash2, Eye } from "lucide-react";
import { DatasetResponse, DatasetType, DatasetStatus } from "#pkg/seedar/types";
import styles from "./DatasetCard.module.scss";

interface DatasetCardProps {
  dataset: DatasetResponse;
  onViewDetails?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const DatasetCard = ({
  dataset,
  onViewDetails,
  onEdit,
  onDelete,
}: DatasetCardProps) => {
  const getTypeText = (type: DatasetType) => {
    return type === DatasetType.SEMANTIC ? "语义型" : "宽表型";
  };

  const getStatusText = (status: DatasetStatus) => {
    return status === DatasetStatus.ACTIVE ? "启用" : "禁用";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Database size={20} className={styles.icon} />
          <h3 className={styles.name}>{dataset.name}</h3>
        </div>
        <div
          className={`${styles.status} ${styles[`status-${dataset.status}`]}`}
        >
          {getStatusText(dataset.status)}
        </div>
      </div>

      <div className={styles.content}>
        {dataset.description && (
          <p className={styles.description}>{dataset.description}</p>
        )}
        <div className={styles.infoRow}>
          <span className={styles.label}>类型</span>
          <span className={styles.value}>{getTypeText(dataset.type)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>数据源</span>
          <span className={styles.value}>
            {dataset.datasource?.name || "-"}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>字段 / 指标</span>
          <span className={styles.value}>
            {dataset.fields?.length || 0} / {dataset.metrics?.length || 0}
          </span>
        </div>
      </div>

      <div className={styles.footer}>
        <button
          className={styles.actionButton}
          onClick={() => onViewDetails?.(dataset.id)}
          title="查看详情"
        >
          <Eye size={16} />
          查看
        </button>
        <button
          className={styles.actionButton}
          onClick={() => onEdit?.(dataset.id)}
          title="编辑"
        >
          编辑
        </button>
        <button
          className={`${styles.actionButton} ${styles.deleteButton}`}
          onClick={() => onDelete?.(dataset.id)}
          title="删除"
        >
          <Trash2 size={16} />
          删除
        </button>
      </div>
    </div>
  );
};
