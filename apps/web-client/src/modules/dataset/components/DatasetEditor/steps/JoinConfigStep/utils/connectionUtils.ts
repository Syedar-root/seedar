import type { Edge } from "@xyflow/react";
import { JoinType } from "#pkg/seedar/types";

export interface JoinEdgeData {
  [key: string]: unknown;
  joinType: JoinType;
  leftFieldName: string;
  rightFieldName: string;
  leftTableId: string;
  rightTableId: string;
  joinId: string;
}

export const hasEdgeBetweenTables = (
  edges: Edge<JoinEdgeData>[],
  tableId1: string,
  tableId2: string,
): boolean => {
  return edges.some(
    (edge) =>
      (edge.source === tableId1 && edge.target === tableId2) ||
      (edge.source === tableId2 && edge.target === tableId1),
  );
};

export const isHandleConnected = (
  edges: Edge<JoinEdgeData>[],
  tableId: string,
  columnName: string,
  handleType: "source" | "target",
): boolean => {
  return edges.some((edge) => {
    const sourceHandle = edge.sourceHandle;
    const targetHandle = edge.targetHandle;
    const expectedHandleId = `${tableId}:${columnName}:${handleType}`;
    return sourceHandle === expectedHandleId || targetHandle === expectedHandleId;
  });
};

export const getConnectedFieldsSet = (
  edges: Edge<JoinEdgeData>[],
  tableId: string,
): Set<string> => {
  const connected = new Set<string>();
  edges.forEach((edge) => {
    if (edge.source === tableId && edge.sourceHandle) {
      connected.add(edge.sourceHandle);
    }
    if (edge.target === tableId && edge.targetHandle) {
      connected.add(edge.targetHandle);
    }
  });
  return connected;
};

export const createEdgeId = (sourceTableId: string, targetTableId: string): string => {
  return `join-${sourceTableId}-${targetTableId}`;
};

export interface ParsedHandleId {
  tableId: string;
  columnName: string;
  handleType: "source" | "target";
}

export const parseHandleId = (handleId: string | null): ParsedHandleId | null => {
  if (!handleId) return null;
  const parts = handleId.split(":");
  if (parts.length !== 3) return null;
  const [tableId, columnName, handleType] = parts;
  if (handleType !== "source" && handleType !== "target") return null;
  return { tableId, columnName, handleType };
};
