import { ArrowLeft, Database, PencilLine } from "lucide-react";
import { DatasourceResponse } from "#pkg/seedar/types";
import styles from "./DatasourceHero.module.scss";

interface DatasourceHeroProps {
  datasource: DatasourceResponse;
  onBack?: () => void;
  onEdit?: () => void;
}

export const DatasourceHero = ({
  datasource,
  onBack,
  onEdit,
}: DatasourceHeroProps) => {
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "正常",
      invalid: "无效",
      deleted: "已删除",
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: string) => {
    return styles[`status-${status}`] || styles["status-invalid"];
  };

  const getDatasourceTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      mysql: "MySQL",
      postgres: "PostgreSQL",
      clickhouse: "ClickHouse",
      csv: "CSV",
      excel: "Excel",
    };
    return typeLabels[type] || type.toUpperCase();
  };

  const connectionPort =
    datasource.config?.port ||
    (datasource.type === "mysql"
      ? "3306"
      : datasource.type === "postgres"
        ? "5432"
        : "8123");

  return (
    <div className={styles.heroSection}>
      <div className={styles.heroContent}>
        {onBack && (
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
            aria-label="返回数据源列表"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className={styles.heroInfo}>
          <div className={styles.heroTopRow}>
            <div className={styles.heroMetaLeft}>
              <div className={styles.typeIcon}>
                <Database size={24} />
              </div>
              <div className={styles.metaTextGroup}>
                <div className={styles.typeLabel}>
                  {getDatasourceTypeLabel(datasource.type)}
                </div>
                {datasource.config?.database && (
                  <div className={styles.databaseName}>
                    <span className={styles.metaLabel}>数据库</span>
                    {datasource.config.database}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.heroMetaRight}>
              <span
                className={`${styles.statusBadge} ${getStatusClass(
                  datasource.status,
                )}`}
              >
                {getStatusText(datasource.status)}
              </span>
            </div>
          </div>

          <div className={styles.titleRow}>
            <h1 className={styles.heroTitle}>{datasource.name}</h1>
            {onEdit && (
              <button
                type="button"
                className={styles.editButton}
                onClick={onEdit}
                aria-label="编辑数据源"
              >
                <PencilLine size={15} />
                编辑
              </button>
            )}
          </div>

          {datasource.config?.host && (
            <div className={styles.connectionInfo}>
              <span className={styles.metaLabel}>连接地址:</span>
              <span className={styles.hostInfo}>
                {datasource.config.host}:{connectionPort}
              </span>
            </div>
          )}

          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {datasource.tables?.length || 0}
              </div>
              <div className={styles.statLabel}>数据表</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {datasource.tables?.reduce(
                  (sum, table) => sum + table.columns.length,
                  0,
                ) || 0}
              </div>
              <div className={styles.statLabel}>字段总数</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {datasource.foreignKeys?.length || 0}
              </div>
              <div className={styles.statLabel}>外键关系</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {new Date(datasource.createdAt).toLocaleDateString("zh-CN")}
              </div>
              <div className={styles.statLabel}>创建于</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
