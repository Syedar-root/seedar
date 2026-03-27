import { Database, Trash2, Eye } from "lucide-react";
import { DatasourceResponse, DataSourceStatus } from "#pkg/seedar/types";
import styles from "./datasourceCard.module.scss";

interface DatasourceCardProps {
  datasource: DatasourceResponse;
  onViewDetails?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const DatasourceCard = ({
  datasource,
  onViewDetails,
  onDelete,
}: DatasourceCardProps) => {
  const getStatusText = (status: DataSourceStatus) => {
    switch (status) {
      case DataSourceStatus.ACTIVE:
        return "正常";
      case DataSourceStatus.INVALID:
        return "无效";
      case DataSourceStatus.DELETED:
        return "已删除";
      default:
        return "未知";
    }
  };

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      mysql: "MySQL",
      postgres: "PostgreSQL",
      clickhouse: "ClickHouse",
      csv: "CSV",
      excel: "Excel",
    };
    return typeMap[type] || type.toUpperCase();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConnectionInfo = () => {
    const config = datasource.config;
    if (config.host) {
      return `${config.host}:${config.port || "3306"}`;
    }
    if (config.filePath) {
      return config.filePath;
    }
    return "-";
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Database size={20} className={styles.icon} />
          <h3 className={styles.name}>{datasource.name}</h3>
        </div>
        <div
          className={`${styles.status} ${styles[`status-${datasource.status}`]}`}
        >
          {getStatusText(datasource.status)}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.infoRow}>
          <span className={styles.label}>类型</span>
          <span className={styles.value}>{getTypeText(datasource.type)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>连接信息</span>
          <span className={styles.value}>{getConnectionInfo()}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>创建时间</span>
          <span className={styles.value}>{formatDate(datasource.createdAt)}</span>
        </div>
        {datasource.lastValidateAt && (
          <div className={styles.infoRow}>
            <span className={styles.label}>最后验证</span>
            <span className={styles.value}>
              {formatDate(datasource.lastValidateAt)}
            </span>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.actionButton}
          onClick={() => onViewDetails?.(datasource.id)}
          title="查看详情"
        >
          <Eye size={16} />
          <span>详情</span>
        </button>
        <button
          className={styles.actionButton}
          onClick={() => onDelete?.(datasource.id)}
          title="删除"
        >
          <Trash2 size={16} />
          <span>删除</span>
        </button>
      </div>
    </div>
  );
};
