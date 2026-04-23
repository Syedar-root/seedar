import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { ConnectionConfig } from "../ConnectionForm/ConnectionForm";
import styles from "./ConnectionTest.module.scss";

interface ConnectionTestProps {
  config: ConnectionConfig;
  onTest?: (
    config: ConnectionConfig,
  ) => Promise<{ success: boolean; message: string }>;
}

export const ConnectionTest: React.FC<ConnectionTestProps> = ({
  config,
  onTest,
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTest = async () => {
    if (!onTest) {
      setResult({
        success: true,
        message: "测试连接功能尚未实现",
      });
      return;
    }

    setIsTesting(true);
    setResult(null);

    try {
      const testResult = await onTest(config);
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "测试失败，请稍后重试",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const canTest = () => {
    return !!(
      config.host &&
      config.port &&
      config.database &&
      config.username &&
      config.password
    );
  };

  return (
    <div className={styles.container}>
      <button
        className={`${styles.testButton} ${result?.success ? styles.success : result?.success === false ? styles.error : ""}`}
        onClick={handleTest}
        disabled={isTesting || !canTest()}
        type="button"
      >
        {isTesting ? (
          <>
            <Loader2 size={16} className={styles.spinner} />
            测试中...
          </>
        ) : result ? (
          <>
            {result.success ? (
              <>
                <CheckCircle size={16} className={styles.icon} />
                {"连接成功"}
              </>
            ) : (
              <>
                <XCircle size={16} className={styles.icon} />
                {"连接失败"}
              </>
            )}
          </>
        ) : (
          "测试连接"
        )}
      </button>

      {result && (
        <div
          className={`${styles.resultMessage} ${result.success ? styles.success : styles.error}`}
        >
          {result.success ? (
            <CheckCircle size={16} className={styles.icon} />
          ) : (
            <XCircle size={16} className={styles.icon} />
          )}
          {result.message}
        </div>
      )}
    </div>
  );
};
