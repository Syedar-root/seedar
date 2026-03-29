import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import { JoinType } from "#pkg/seedar/types";
import type { JoinEdgeData } from "./useGraphData";
import styles from "./JoinRelationGraph.module.scss";

const getJoinTypeLabel = (type: JoinType): string => {
  const typeMap: Record<JoinType, string> = {
    [JoinType.INNER]: "INNER",
    [JoinType.LEFT]: "LEFT",
    [JoinType.RIGHT]: "RIGHT",
  };
  return typeMap[type] || type;
};

const getJoinTypeClass = (type: JoinType): string => {
  const classMap: Record<JoinType, string> = {
    [JoinType.INNER]: styles.edgeInner,
    [JoinType.LEFT]: styles.edgeLeft,
    [JoinType.RIGHT]: styles.edgeRight,
  };
  return classMap[type] || "";
};

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

    const {
      joinType,
      leftFieldName,
      rightFieldName,
      operator,
      direction = "TB",
      selected = false,
    } = data;
    const joinTypeLabel = getJoinTypeLabel(joinType);
    const edgeClass = getJoinTypeClass(joinType);
    const isHorizontal = direction === "LR" || direction === "RL";

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          className={`${styles.joinEdge} ${edgeClass} ${
            selected ? styles.edgeSelected : ""
          }`}
        />
        {selected && (
          <EdgeLabelRenderer>
            <div
              className={`${styles.edgeLabel} ${edgeClass} ${
                isHorizontal ? styles.edgeLabelHorizontal : ""
              }`}
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: "all",
              }}
            >
              <div className={styles.edgeLabelLeftField}>{leftFieldName}</div>
              <div className={styles.edgeLabelType}>
                <span className={styles.edgeLabelTypeIcon}>{joinTypeLabel}</span>
              </div>
              <div className={styles.edgeLabelRightField}>{rightFieldName}</div>
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  },
);

JoinEdge.displayName = "JoinEdge";
