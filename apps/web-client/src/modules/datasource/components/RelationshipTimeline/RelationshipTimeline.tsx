import { Link2 } from "lucide-react";
import { ForeignKeyResponse } from "#pkg/seedar/types";
import styles from "./RelationshipTimeline.module.scss";

interface RelationshipTimelineProps {
  foreignKeys?: ForeignKeyResponse[];
}

export const RelationshipTimeline = ({
  foreignKeys,
}: RelationshipTimelineProps) => {
  if (!foreignKeys || foreignKeys.length === 0) {
    return null;
  }

  return (
    <div className={styles.relationshipTimeline}>
      {foreignKeys.map((fk, index) => (
        <div
          key={index}
          className={styles.relationshipNode}
          style={
            {
              "--delay": `${index * 0.05}s`,
            } as React.CSSProperties
          }
        >
          <div className={styles.relationshipHeader}>
            <div className={styles.relationshipIcon}>
              <Link2 size={14} />
            </div>
            <h3 className={styles.relationshipName}>{fk.fkName}</h3>
          </div>
          <div className={styles.relationshipBody}>
            <div className={styles.relationshipFlow}>
              <div className={styles.flowEndpoint}>
                <span className={styles.flowColumn}>{fk.sourceColumnName}</span>
                <span className={styles.flowTable}>{fk.sourceTableName}</span>
              </div>

              <div className={styles.flowDivider}>
                <svg
                  width="24"
                  height="12"
                  viewBox="0 0 32 16"
                  fill="none"
                  className={styles.flowArrow}
                >
                  <path
                    d="M0 8h24M20 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <div className={`${styles.flowEndpoint} ${styles.isTarget}`}>
                <span className={styles.flowColumn}>{fk.targetColumnName}</span>
                <span className={styles.flowTable}>{fk.targetTableName}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
