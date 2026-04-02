import type { DatasourceType } from "../DatasourceTypeSelector/DatasourceTypeSelector";
import styles from "./ConnectionForm.module.scss";

export interface ConnectionConfig {
  type: DatasourceType;
  name: string;
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  password?: string;
}

interface ConnectionFormProps {
  type: DatasourceType;
  config: ConnectionConfig;
  onChange: (config: ConnectionConfig) => void;
}

export const ConnectionForm: React.FC<ConnectionFormProps> = ({
  type,
  config,
  onChange,
}) => {
  const handleFieldChange = (field: keyof ConnectionConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  const renderDatabaseForm = () => (
    <div className={styles.form}>
      <div className={styles.formGroup}>
        <label className={styles.label}>
          主机地址 <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          className={styles.input}
          value={config.host || ""}
          onChange={(e) => handleFieldChange("host", e.target.value)}
          placeholder="例如: localhost"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          端口 <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          className={styles.input}
          value={config.port || ""}
          onChange={(e) => handleFieldChange("port", e.target.value)}
          placeholder={
            type === "mysql" ? "3306" : type === "postgres" ? "5432" : "8123"
          }
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          数据库名 <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          className={styles.input}
          value={config.database || ""}
          onChange={(e) => handleFieldChange("database", e.target.value)}
          placeholder="请输入数据库名称"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          用户名 <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          className={styles.input}
          value={config.username || ""}
          onChange={(e) => handleFieldChange("username", e.target.value)}
          placeholder="请输入用户名"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          密码 <span className={styles.required}>*</span>
        </label>
        <input
          type="password"
          className={styles.input}
          value={config.password || ""}
          onChange={(e) => handleFieldChange("password", e.target.value)}
          placeholder="请输入密码"
        />
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.label}>
        数据库配置 <span className={styles.required}>*</span>
      </div>
      {renderDatabaseForm()}
    </div>
  );
};
