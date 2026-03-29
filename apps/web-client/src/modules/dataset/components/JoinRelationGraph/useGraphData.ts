import { useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import {
  DatasetJoinResponse,
  DatasetTableResponse,
  DatasetFieldResponse,
  JoinType,
} from "#pkg/seedar/types";

export interface TableNodeData {
  [key: string]: unknown;
  tableName: string;
  datasetName?: string;
  isMainTable: boolean;
  tableId: number;
}

export interface JoinEdgeData {
  [key: string]: unknown;
  joinType: JoinType;
  leftFieldName: string;
  rightFieldName: string;
  leftTableName: string;
  rightTableName: string;
  operator: string;
  direction?: "TB" | "LR" | "BT" | "RL";
  selected?: boolean;
}

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

const getFieldNameByColumnId = (
  columnId: string,
  fields: DatasetFieldResponse[]
): string => {
  const numericId = parseInt(columnId, 10);
  const field = fields.find((f) => f.datasourceColumnId === numericId);
  return field?.businessName || field?.name || columnId;
};

const getTableName = (
  tableId: number,
  tables: DatasetTableResponse[]
): string => {
  const table = tables.find((t) => t.id === tableId);
  return table?.datasetName || table?.tableName || `表${tableId}`;
};

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
