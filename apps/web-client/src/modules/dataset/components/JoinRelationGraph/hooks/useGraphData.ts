import { useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import {
  DatasetJoinResponse,
  DatasetTableResponse,
  DatasetFieldResponse,
} from "#pkg/seedar/types";
import { getFieldNameByColumnId, getTableName } from "../utils/graphUtils";
import type { TableNodeData, JoinEdgeData } from "../types";

interface UseGraphDataParams {
  joins: DatasetJoinResponse[];
  tables: DatasetTableResponse[];
  fields: DatasetFieldResponse[];
  mainTableId?: number;
  direction?: "TB" | "LR" | "BT" | "RL";
}

interface UseGraphDataReturn {
  nodes: Node<TableNodeData>[];
  edges: Edge<JoinEdgeData>[];
}

export const useGraphData = ({
  joins,
  tables,
  fields,
  mainTableId,
  direction,
}: UseGraphDataParams): UseGraphDataReturn => {
  const nodes = useMemo<Node<TableNodeData>[]>(() => {
    return tables.map((table) => ({
      id: table.id.toString(),
      type: "tableNode",
      position: { x: 0, y: 0 },
      data: {
        tableName: table.tableName,
        datasetName: table.datasetName,
        isMainTable: table.id === mainTableId,
        tableId: table.id,
      },
    }));
  }, [tables, mainTableId]);

  const edges = useMemo<Edge<JoinEdgeData>[]>(() => {
    return joins.map((join) => {
      const leftTableName = getTableName(join.leftTableId, tables);
      const rightTableName = getTableName(join.rightTableId, tables);
      const leftFieldName = getFieldNameByColumnId(join.leftField, fields);
      const rightFieldName = getFieldNameByColumnId(join.rightField, fields);

      const isHorizontal = direction === "LR" || direction === "RL";
      
      return {
        id: `join-${join.id}`,
        source: join.leftTableId.toString(),
        target: join.rightTableId.toString(),
        sourceHandle: isHorizontal ? "right" : "bottom",
        targetHandle: isHorizontal ? "left" : "top",
        type: "joinEdge",
        animated: false,
        data: {
          joinType: join.joinType,
          leftFieldName,
          rightFieldName,
          leftTableName,
          rightTableName,
          operator: join.operator || "=",
          direction,
        },
      };
    });
  }, [joins, tables, fields]);

  return { nodes, edges };
};
