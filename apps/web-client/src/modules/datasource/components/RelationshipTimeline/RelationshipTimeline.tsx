import { ForeignKeyResponse } from "#pkg/seedar/types";
import styles from "./RelationshipTimeline.module.scss";

interface RelationshipTimelineProps {
  foreignKeys?: ForeignKeyResponse[];
}

export const RelationshipTimeline = ({ foreignKeys }: RelationshipTimelineProps) => {
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
          <div className={styles.relationshipContent}>
            <div className={styles.relationshipHeader}>
              <code className={styles.relationshipName}>
                {fk.fkName}
              </code>
            </div>
            <div className={styles.relationshipFlow}>
              <div className={styles.flowEndpoint}>
                <span className={styles.flowTable}>
                  {fk.sourceTableName}
                </span>
                <span className={styles.flowColumn}>
                  {fk.sourceColumnName}
                </span>
              </div>
              <div className={styles.flowArrow}>
                <svg width="20" height="10" viewBox="0 0 32 16">
                  <path
                    d="M0 8h24M20 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
              <div className={styles.flowEndpoint}>
                <span className={styles.flowTable}>
                  {fk.targetTableName}
                </span>
                <span className={styles.flowColumn}>
                  {fk.targetColumnName}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
