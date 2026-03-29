import type { Node, Edge } from "@xyflow/react";
import { JoinType } from "#pkg/seedar/types";

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

export type FlowNode = Node<TableNodeData>;
export type FlowEdge = Edge<JoinEdgeData>;

export interface LayoutOptions {
  direction?: "TB" | "LR" | "BT" | "RL";
  nodeWidth?: number;
  nodeHeight?: number;
  nodeSeparation?: number;
  rankSeparation?: number;
}
