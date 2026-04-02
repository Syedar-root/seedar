import { Database } from "lucide-react";
import styles from "./DatasourceTypeSelector.module.scss";

export type DatasourceType = "mysql" | "postgres" | "clickhouse";

interface DatasourceTypeSelectorProps {
  value: DatasourceType;
  onChange: (type: DatasourceType) => void;
}

const DATASOURCE_TYPES = [
  {
    type: "mysql" as const,
    label: "MySQL",
    icon: <Database size={24} className={styles.icon} />,
    description: "关系型数据库",
  },
  {
    type: "postgres" as const,
    label: "PostgreSQL",
    icon: <Database size={24} className={styles.icon} />,
    description: "开源关系型数据库",
  },
  {
    type: "clickhouse" as const,
    label: "ClickHouse",
    icon: <Database size={24} className={styles.icon} />,
    description: "列式数据库",
  },
];

export const DatasourceTypeSelector: React.FC<DatasourceTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.label}>
        数据源类型 <span className={styles.required}>*</span>
      </div>
      <div className={styles.grid}>
        {DATASOURCE_TYPES.map((item) => (
          <button
            key={item.type}
            className={`${styles.card} ${value === item.type ? styles.active : ""}`}
            onClick={() => onChange(item.type)}
            type="button"
          >
            <div className={styles.cardIcon}>{item.icon}</div>
            <div className={styles.cardLabel}>{item.label}</div>
            <div className={styles.cardDescription}>{item.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
