import { DatasetJoinResponse, DatasetTableResponse, JoinType } from "#pkg/seedar/types";
import { ArrowRight } from "lucide-react";
import styles from "./JoinRelationList.module.scss";

interface JoinRelationListProps {
  joins: DatasetJoinResponse[];
  tables: DatasetTableResponse[];
}

const getJoinTypeLabel = (type: JoinType): string => {
  const typeMap: Record<JoinType, string> = {
    [JoinType.INNER]: "INNER JOIN",
    [JoinType.LEFT]: "LEFT JOIN",
    [JoinType.RIGHT]: "RIGHT JOIN",
  };
  return typeMap[type] || type;
};

const getJoinTypeClass = (type: JoinType): string => {
  const classMap: Record<JoinType, string> = {
    [JoinType.INNER]: styles.joinInner,
    [JoinType.LEFT]: styles.joinLeft,
    [JoinType.RIGHT]: styles.joinRight,
  };
  return classMap[type] || "";
};

const getTableName = (tableId: number, tables: DatasetTableResponse[]): string => {
  const table = tables.find((t) => t.id === tableId);
  return table?.datasetName || table?.tableName || `表${tableId}`;
};

export const JoinRelationList = ({ joins, tables }: JoinRelationListProps) => {
  if (!joins || joins.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>暂无关联关系</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {joins.map((join) => (
        <div key={join.id} className={styles.joinItem}>
          <div className={styles.joinHeader}>
            <span className={`${styles.joinType} ${getJoinTypeClass(join.joinType)}`}>
              {getJoinTypeLabel(join.joinType)}
            </span>
          </div>
          <div className={styles.joinRelation}>
            <div className={styles.tableInfo}>
              <span className={styles.tableName}>{getTableName(join.rightTableId, tables)}</span>
              <span className={styles.fieldName}>.{join.rightField}</span>
            </div>
            <ArrowRight size={16} className={styles.arrowIcon} />
            <div className={styles.tableInfo}>
              <span className={styles.fieldName}>{join.leftField}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
