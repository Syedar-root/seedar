import { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { TableFieldNode } from "./components";
import { JoinEdge } from "./components";
import { JoinInfoPanel } from "./components";
import { getLayoutedElements } from "./utils/graphLayout";
import {
  parseHandleId,
  hasEdgeBetweenTables,
  getConnectedFieldsSet,
  type JoinEdgeData,
} from "./utils";
import type {
  DatasetFormData,
  JoinConfig,
} from "../../../../types/editor.types";
import type { DatasourceResponse } from "#pkg/seedar/types";
import styles from "./JoinConfigStep.module.scss";

const nodeTypes: NodeTypes = {
  tableFieldNode: TableFieldNode,
};

const edgeTypes: EdgeTypes = {
  joinEdge: JoinEdge,
};

interface TableFieldNodeData {
  [key: string]: unknown;
  tableId: string;
  tableName: string;
  isMainTable: boolean;
  columns: Array<{
    columnName: string;
    isPrimaryKey?: boolean;
    type?: string;
  }>;
  connectedFields?: Set<string>;
}

type TableNode = Node<TableFieldNodeData, "tableFieldNode">;

interface JoinConfigStepProps {
  formData: DatasetFormData;
  selectedDatasource?: DatasourceResponse;
  onAddJoin: (join: JoinConfig) => void;
  onRemoveJoin: (joinId: string) => void;
  onUpdateJoin: (joinId: string, updates: Partial<JoinConfig>) => void;
}

export const JoinConfigStep = ({
  formData,
  selectedDatasource,
  onAddJoin,
  onRemoveJoin,
  onUpdateJoin,
}: JoinConfigStepProps) => {
  const isSingleTable = formData.tables.length <= 1;

  const getTableColumns = useCallback(
    (tableId: string) => {
      const table = formData.tables.find((t) => t.tableId === tableId);
      if (!table || !selectedDatasource?.tables) return [];
      const datasourceTable = selectedDatasource.tables.find(
        (t) => t.tableName === table.tableName,
      );
      return datasourceTable?.columns || [];
    },
    [formData.tables, selectedDatasource],
  );

  const rawNodes = useMemo((): TableNode[] => {
    return formData.tables.map((table) => {
      const columns = getTableColumns(table.tableId);
      const isMainTable = table.tableId === formData.mainTable;

      return {
        id: table.tableId,
        type: "tableFieldNode" as const,
        position: { x: 0, y: 0 },
        data: {
          tableId: table.tableId,
          tableName: table.tableName,
          isMainTable,
          columns: columns.map((col) => ({
            columnName: col.columnName,
            isPrimaryKey: col.isPrimaryKey,
            type: col.normalizedType,
          })),
        },
      };
    });
  }, [formData.tables, formData.mainTable, getTableColumns]);

  const rawEdges = useMemo((): Edge[] => {
    return formData.joins.map((join) => {
      return {
        id: join.id,
        source: join.leftTable,
        target: join.rightTable,
        sourceHandle: `${join.leftTable}:${join.leftField}:source`,
        targetHandle: `${join.rightTable}:${join.rightField}:target`,
        type: "joinEdge",
        data: {
          joinType: join.joinType,
          leftFieldName: join.leftField,
          rightFieldName: join.rightField,
          leftTableId: join.leftTable,
          rightTableId: join.rightTable,
          joinId: join.id,
        } as JoinEdgeData,
      };
    });
  }, [formData.joins]);

  const nodesWithLayout = useMemo(() => {
    return getLayoutedElements(rawNodes, rawEdges, { direction: "LR" });
  }, [formData.tables.length]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodesWithLayout);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(rawEdges);

  useEffect(() => {
    const nodesWithConnectedFields = nodesWithLayout.map((node) => {
      const connectedFields = getConnectedFieldsSet(
        rawEdges as Edge<JoinEdgeData>[],
        node.id,
      );
      return {
        ...node,
        data: {
          ...node.data,
          connectedFields,
        },
      };
    });
    setNodes(nodesWithConnectedFields);
    setEdges(rawEdges);
  }, [nodesWithLayout, rawEdges, setNodes, setEdges]);

  const isValidConnection = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return false;
    if (!connection.sourceHandle || !connection.targetHandle) return false;

    const sourceInfo = parseHandleId(connection.sourceHandle);
    const targetInfo = parseHandleId(connection.targetHandle);

    if (!sourceInfo || !targetInfo) return false;
    if (sourceInfo.tableId === targetInfo.tableId) return false;

    return true;
  }, []);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!isValidConnection(connection)) return;

      const sourceInfo = parseHandleId(connection.sourceHandle!);
      const targetInfo = parseHandleId(connection.targetHandle!);

      if (!sourceInfo || !targetInfo) return;

      if (
        hasEdgeBetweenTables(
          rawEdges as Edge<JoinEdgeData>[],
          sourceInfo.tableId,
          targetInfo.tableId,
        )
      ) {
        toast.warning("两表之间已存在关联关系");
        return;
      }

      const newJoin: JoinConfig = {
        id: `join-${Date.now()}`,
        leftTable: sourceInfo.tableId,
        leftField: sourceInfo.columnName,
        joinType: "inner",
        rightTable: targetInfo.tableId,
        rightField: targetInfo.columnName,
      };

      onAddJoin(newJoin);
    },
    [isValidConnection, rawEdges, onAddJoin],
  );

  if (isSingleTable) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <AlertCircle size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>无需配置关联</h3>
          <p className={styles.emptyText}>
            当前数据集只包含单个表，不需要配置表之间的关联关系。
          </p>
        </div>
      </div>
    );
  }

  if (!selectedDatasource || selectedDatasource.tables?.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <AlertCircle size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>暂无数据源</h3>
          <p className={styles.emptyText}>
            请先在数据源与表步骤中选择数据源和表。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.flowContainer}>
        <ReactFlow
          nodes={nodesState}
          edges={edgesState}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={true}
          nodesConnectable={true}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: "joinEdge",
          }}
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as { isMainTable?: boolean };
              return data?.isMainTable ? "#fef3c7" : "#e5e7eb";
            }}
            nodeStrokeColor="#374151"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>

      <JoinInfoPanel
        joins={formData.joins}
        tables={formData.tables}
        onUpdateJoin={onUpdateJoin}
        onRemoveJoin={onRemoveJoin}
      />
    </div>
  );
};
