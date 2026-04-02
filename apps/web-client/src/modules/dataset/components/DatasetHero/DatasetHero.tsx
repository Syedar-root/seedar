import { ArrowLeft, Database } from "lucide-react";
import { DatasetResponse, DatasetStatus, DatasetType } from "#pkg/seedar/types";
import styles from "./DatasetHero.module.scss";

interface DatasetHeroProps {
  dataset: DatasetResponse;
  onBack?: () => void;
}

export const DatasetHero = ({ dataset, onBack }: DatasetHeroProps) => {
  const getStatusText = (status: DatasetStatus) => {
    const statusMap: Record<string, string> = {
      [DatasetStatus.ACTIVE]: "启用",
      [DatasetStatus.DISABLED]: "禁用",
      [DatasetStatus.DELETED]: "已删除",
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: DatasetStatus) => {
    const classMap: Record<string, string> = {
      [DatasetStatus.ACTIVE]: styles.statusActive,
      [DatasetStatus.DISABLED]: styles.statusDisabled,
      [DatasetStatus.DELETED]: styles.statusDeleted,
    };
    return classMap[status] || styles.statusDisabled;
  };

  const getTypeLabel = (type: DatasetType) => {
    return type === DatasetType.SEMANTIC ? "语义型" : "宽表型";
  };

  return (
    <div className={styles.heroSection}>
      <div className={styles.heroContent}>
        {onBack && (
          <button
            className={styles.backButton}
            onClick={onBack}
            aria-label="返回数据集列表"
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
                <div className={styles.typeLabel}>{getTypeLabel(dataset.type)}</div>
                {dataset.datasource && (
                  <div className={styles.datasourceName}>
                    <span className={styles.metaLabel}>数据源:</span>
                    {dataset.datasource.name}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.heroMetaRight}>
              <span className={`${styles.statusBadge} ${getStatusClass(dataset.status)}`}>
                {getStatusText(dataset.status)}
              </span>
            </div>
          </div>

          <h1 className={styles.heroTitle}>{dataset.name}</h1>

          {dataset.description && (
            <p className={styles.heroDescription}>{dataset.description}</p>
          )}

          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {dataset.tables?.length || 0}
              </div>
              <div className={styles.statLabel}>数据表</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {dataset.fields?.length || 0}
              </div>
              <div className={styles.statLabel}>字段</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {dataset.metrics?.length || 0}
              </div>
              <div className={styles.statLabel}>指标</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {dataset.joins?.length || 0}
              </div>
              <div className={styles.statLabel}>关联</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
