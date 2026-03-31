import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import { JoinType } from "#pkg/seedar/types";
import styles from "./JoinEdge.module.scss";

interface JoinEdgeData {
  [key: string]: unknown;
  joinType: JoinType;
  leftFieldName: string;
  rightFieldName: string;
  operator?: string;
  direction?: "TB" | "LR" | "BT" | "RL";
  selected?: boolean;
}

export const JoinEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
  }: EdgeProps<Edge<JoinEdgeData>>) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    if (!data) return null;

    const { joinType, leftFieldName, rightFieldName, direction = "TB" } = data;
    const joinTypeLabel = joinType?.toUpperCase() || "INNER";

    const getEdgeClass = () => {
      switch (joinType) {
        case JoinType.INNER:
          return styles.edgeInner;
        case JoinType.LEFT:
          return styles.edgeLeft;
        case JoinType.RIGHT:
          return styles.edgeRight;
        default:
          return "";
      }
    };

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          className={`${styles.joinEdge} ${getEdgeClass()}`}
        />
        <EdgeLabelRenderer>
          <div
            className={styles.edgeLabel}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
          >
            <div className={styles.edgeLabelTopRow}>
              <span className={styles.edgeLabelField}>{leftFieldName}</span>
              <span className={styles.edgeLabelArrow}>=</span>
              <span className={styles.edgeLabelField}>{rightFieldName}</span>
            </div>
            <div className={styles.edgeLabelType}>{joinTypeLabel}</div>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

JoinEdge.displayName = "JoinEdge";
