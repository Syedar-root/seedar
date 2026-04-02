import { Database } from "lucide-react";
import styles from "./PageStates.module.scss";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export const EmptyState = ({ 
  title = "数据源不存在", 
  description = "请检查数据源 ID 是否正确" 
}: EmptyStateProps) => {
  return (
    <div className={styles.emptyState}>
      <Database size={48} className={styles.emptyIcon} />
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyDesc}>{description}</p>
    </div>
  );
};
