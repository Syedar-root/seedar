import { Loader2 } from "lucide-react";
import styles from "./PageStates.module.scss";

export const LoadingState = () => {
  return (
    <div className={styles.loadingState}>
      <Loader2 size={32} className={styles.loadingSpinner} />
      <p className={styles.loadingText}>正在加载数据集...</p>
    </div>
  );
};
