import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import type { JoinEdgeData } from "../../types";
import { getJoinTypeLabel, getJoinTypeClass } from "../../utils/graphUtils";
import styles from "./JoinEdge.module.scss";

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
    const edgeClass = getJoinTypeClass(joinType, styles);
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
