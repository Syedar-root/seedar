import { Database } from "lucide-react";
import styles from "./PageStates.module.scss";

export const EmptyState = () => {
  return (
    <div className={styles.emptyState}>
      <Database size={48} className={styles.emptyIcon} />
      <h3 className={styles.emptyTitle}>数据集不存在</h3>
      <p className={styles.emptyDesc}>
        该数据集可能已被删除或您没有访问权限
      </p>
    </div>
  );
};
