import { Loader2 } from "lucide-react";
import styles from "./PageStates.module.scss";

interface LoadingStateProps {
  text?: string;
}

export const LoadingState = ({ text = "正在加载数据源详情..." }: LoadingStateProps) => {
  return (
    <div className={styles.loadingState}>
      <Loader2 size={32} className={styles.loadingSpinner} />
      <p className={styles.loadingText}>{text}</p>
    </div>
  );
};
