import { useState } from "react";
import { ChevronDown, ChevronRight, Key, Columns, Database } from "lucide-react";
import clsx from "clsx";
import styles from "./tableStructure.module.scss";

export interface ColumnInfo {
  columnName: string;
  rawDataType: string;
  normalizedType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
}

export interface ForeignKeyInfo {
  fkName: string;
  sourceTableName: string;
  sourceColumnName: string;
  targetTableName: string;
  targetColumnName: string;
}

export interface TableStructureProps {
  tableName: string;
  tableComment?: string;
  columns: ColumnInfo[];
  foreignKeys?: ForeignKeyInfo[];
}

export const TableStructure = ({
  tableName,
  tableComment,
  columns,
  foreignKeys = [],
}: TableStructureProps) => {
  const [isColumnsExpanded, setIsColumnsExpanded] = useState(true);
  const [isForeignKeysExpanded, setIsForeignKeysExpanded] = useState(true);

  const toggleColumns = () => {
    setIsColumnsExpanded(!isColumnsExpanded);
  };

  const toggleForeignKeys = () => {
    setIsForeignKeysExpanded(!isForeignKeysExpanded);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Database size={20} className={styles.headerIcon} />
        <div className={styles.headerContent}>
          <h3 className={styles.tableName}>{tableName}</h3>
          {tableComment && (
            <p className={styles.tableComment}>{tableComment}</p>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div
          className={styles.sectionHeader}
          onClick={toggleColumns}
        >
          <div className={styles.sectionTitle}>
            {isColumnsExpanded ? (
              <ChevronDown size={16} className={styles.chevron} />
            ) : (
              <ChevronRight size={16} className={styles.chevron} />
            )}
            <Columns size={16} className={styles.sectionIcon} />
            <span>列信息</span>
            <span className={styles.badge}>{columns.length}</span>
          </div>
        </div>

        {isColumnsExpanded && (
          <div className={styles.sectionContent}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>列名</th>
                    <th className={styles.th}>数据类型</th>
                    <th className={styles.th}>可空</th>
                    <th className={styles.th}>主键</th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map((column, index) => (
                    <tr key={index} className={styles.tr}>
                      <td className={styles.td}>
                        {column.isPrimaryKey && (
                          <Key size={12} className={styles.primaryKeyIcon} />
                        )}
                        <span className={clsx(
                          column.isPrimaryKey && styles.primaryKeyText
                        )}>
                          {column.columnName}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.dataType}>
                          {column.rawDataType}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={clsx(
                          styles.badge,
                          column.nullable ? styles.nullable : styles.notNullable
                        )}>
                          {column.nullable ? "是" : "否"}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={clsx(
                          styles.badge,
                          column.isPrimaryKey ? styles.isPrimary : styles.notPrimary
                        )}>
                          {column.isPrimaryKey ? "是" : "否"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {foreignKeys.length > 0 && (
        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={toggleForeignKeys}
          >
            <div className={styles.sectionTitle}>
              {isForeignKeysExpanded ? (
                <ChevronDown size={16} className={styles.chevron} />
              ) : (
                <ChevronRight size={16} className={styles.chevron} />
              )}
              <Key size={16} className={styles.sectionIcon} />
              <span>外键关系</span>
              <span className={styles.badge}>{foreignKeys.length}</span>
            </div>
          </div>

          {isForeignKeysExpanded && (
            <div className={styles.sectionContent}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>外键名</th>
                      <th className={styles.th}>源表</th>
                      <th className={styles.th}>源字段</th>
                      <th className={styles.th}>目标表</th>
                      <th className={styles.th}>目标字段</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foreignKeys.map((fk, index) => (
                      <tr key={index} className={styles.tr}>
                        <td className={styles.td}>
                          <span className={styles.fkName}>{fk.fkName}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.tableName}>{fk.sourceTableName}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.columnName}>{fk.sourceColumnName}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.tableName}>{fk.targetTableName}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.columnName}>{fk.targetColumnName}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
