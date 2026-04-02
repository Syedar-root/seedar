import { DatasetResponse } from "#pkg/seedar/types";
import styles from "./DatasetMetadataBar.module.scss";

interface DatasetMetadataBarProps {
  dataset: DatasetResponse;
}

export const DatasetMetadataBar = ({ dataset }: DatasetMetadataBarProps) => {
  return (
    <div className={styles.metadataBar}>
      {dataset.mainTable && (
        <>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>主表</span>
            <span className={styles.metaValue}>{dataset.mainTable.datasetName || dataset.mainTable.tableName}</span>
          </div>
          <div className={styles.metaDivider} />
        </>
      )}
      {dataset.datasource && (
        <>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>数据源</span>
            <span className={styles.metaValue}>{dataset.datasource.name}</span>
          </div>
          <div className={styles.metaDivider} />
        </>
      )}
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>类型</span>
        <span className={styles.metaValue}>
          {dataset.type === "semantic" ? "语义型" : "宽表型"}
        </span>
      </div>
    </div>
  );
};
