import { DatasourceResponse } from "#pkg/seedar/types";
import styles from "./MetadataBar.module.scss";

interface MetadataBarProps {
  datasource: DatasourceResponse;
}

export const MetadataBar = ({ datasource }: MetadataBarProps) => {
  return (
    <div className={styles.metadataBar}>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>创建于</span>
        <span className={styles.metaValue}>
          {new Date(datasource.createdAt).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
      <div className={styles.metaDivider} />
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>最后更新</span>
        <span className={styles.metaValue}>
          {new Date(datasource.updatedAt).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
      {datasource.lastValidateAt && (
        <>
          <div className={styles.metaDivider} />
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>最后验证</span>
            <span className={styles.metaValue}>
              {new Date(datasource.lastValidateAt).toLocaleDateString(
                "zh-CN",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
