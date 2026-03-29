import { AlertCircle } from "lucide-react";
import styles from "./PageStates.module.scss";

interface ErrorStateProps {
  message?: string;
}

export const ErrorState = ({ message }: ErrorStateProps) => {
  return (
    <div className={styles.errorState}>
      <AlertCircle size={32} className={styles.errorIcon} />
      <p className={styles.errorText}>
        加载失败：{message || "请稍后重试"}
      </p>
    </div>
  );
};
