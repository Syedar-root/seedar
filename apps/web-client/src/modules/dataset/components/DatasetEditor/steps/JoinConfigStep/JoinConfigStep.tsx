import { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AlertCircle, Layout } from "lucide-react";
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

interface ColumnData {
  columnId: string;
  columnName: string;
  isPrimaryKey?: boolean;
  type?: string;
  [key: string]: unknown;
}

interface TableFieldNodeData {
  [key: string]: unknown;
  tableId: string;
  tableName: string;
  isMainTable: boolean;
  columns: ColumnData[];
  connectedFields?: Set<string>;
}

type TableNode = Node<TableFieldNodeData, "tableFieldNode">;

interface JoinConfigStepProps {
  formData: DatasetFormData;
  selectedDatasource?: DatasourceResponse;
  onAddJoin: (join: JoinConfig) => void;
  onRemoveJoin: (joinId: string) => void;
  onUpdateJoin: (joinId: string, updates: Partial<JoinConfig>) => void;
  onReplaceJoins: (joins: JoinConfig[]) => void;
}

const buildJoinKey = ({
  leftTable,
  leftField,
  rightTable,
  rightField,
}: Pick<JoinConfig, "leftTable" | "leftField" | "rightTable" | "rightField">) => {
  const endpoints = [
    `${leftTable}:${leftField}`,
    `${rightTable}:${rightField}`,
  ].sort();

  return endpoints.join("|");
};

export const JoinConfigStep = ({
  formData,
  selectedDatasource,
  onAddJoin,
  onRemoveJoin,
  onUpdateJoin,
  onReplaceJoins,
}: JoinConfigStepProps) => {
  const isSingleTable = formData.tables.length <= 1;

  const getTableName = useCallback(
    (tableId: string) => {
      return (
        formData.tables.find((table) => table.tableId === tableId)?.tableName ||
        tableId
      );
    },
    [formData.tables],
  );

  const getTableColumns = useCallback(
    (tableId: string) => {
      const table = formData.tables.find((item) => item.tableId === tableId);
      if (!table || !selectedDatasource?.tables) {
        return [];
      }

      return (
        selectedDatasource.tables.find((item) => item.tableName === table.tableName)
          ?.columns || []
      );
    },
    [formData.tables, selectedDatasource],
  );

  const getTableColumnsMap = useCallback(
    (tableId: string) => {
      const table = formData.tables.find((item) => item.tableId === tableId);
      if (!table || !selectedDatasource?.tables) {
        return {};
      }

      const datasourceTable = selectedDatasource.tables.find(
        (item) => item.tableName === table.tableName,
      );
      if (!datasourceTable?.columns) {
        return {};
      }

      return datasourceTable.columns.reduce(
        (accumulator, column) => ({
          ...accumulator,
          [String(column.columnId)]: {
            ...column,
            columnId: String(column.columnId),
          },
        }),
        {} as Record<string, ColumnData>,
      );
    },
    [formData.tables, selectedDatasource],
  );

  const selectedTablesByName = useMemo(() => {
    return new Map(formData.tables.map((table) => [table.tableName, table]));
  }, [formData.tables]);

  const datasourceTablesByName = useMemo(() => {
    return new Map(
      (selectedDatasource?.tables || []).map((table) => [table.tableName, table]),
    );
  }, [selectedDatasource?.tables]);

  const datasourceForeignKeyJoins = useMemo((): JoinConfig[] => {
    const joins: Array<JoinConfig | null> = (selectedDatasource?.foreignKeys || [])
      .map((foreignKey, index) => {
        const leftTable = selectedTablesByName.get(foreignKey.sourceTableName);
        const rightTable = selectedTablesByName.get(foreignKey.targetTableName);

        if (!leftTable || !rightTable) {
          return null;
        }

        const leftDatasourceTable = datasourceTablesByName.get(leftTable.tableName);
        const rightDatasourceTable = datasourceTablesByName.get(
          rightTable.tableName,
        );

        const leftColumn = leftDatasourceTable?.columns.find(
          (column) => column.columnName === foreignKey.sourceColumnName,
        );
        const rightColumn = rightDatasourceTable?.columns.find(
          (column) => column.columnName === foreignKey.targetColumnName,
        );

        if (!leftColumn?.columnId || !rightColumn?.columnId) {
          return null;
        }

        return {
          id: `datasource-join-${index}-${leftColumn.columnId}-${rightColumn.columnId}`,
          leftTable: leftTable.tableId,
          leftField: String(leftColumn.columnId),
          joinType: "inner",
          rightTable: rightTable.tableId,
          rightField: String(rightColumn.columnId),
        };
      });

    const validJoins = joins.filter((join): join is JoinConfig => join !== null);

    return Array.from(
      new Map(validJoins.map((join) => [buildJoinKey(join), join])).values(),
    );
  }, [datasourceTablesByName, selectedDatasource?.foreignKeys, selectedTablesByName]);

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
          columns: columns.map((column) => ({
            columnId: String(column.columnId),
            columnName: column.columnName,
            isPrimaryKey: column.isPrimaryKey,
            type: column.normalizedType,
          })),
        },
      };
    });
  }, [formData.mainTable, formData.tables, getTableColumns]);

  const rawEdges = useMemo((): Edge[] => {
    return formData.joins.map((join) => {
      const leftTableColumnsMap = getTableColumnsMap(join.leftTable);
      const rightTableColumnsMap = getTableColumnsMap(join.rightTable);
      const leftColumn = leftTableColumnsMap[join.leftField];
      const rightColumn = rightTableColumnsMap[join.rightField];
      const leftColumnName = leftColumn?.columnName || join.leftField;
      const rightColumnName = rightColumn?.columnName || join.rightField;

      return {
        id: join.id,
        source: join.leftTable,
        target: join.rightTable,
        sourceHandle: `${join.leftTable}:${join.leftField}:source:${leftColumnName}`,
        targetHandle: `${join.rightTable}:${join.rightField}:target:${rightColumnName}`,
        type: "joinEdge",
        data: {
          joinType: join.joinType,
          leftFieldName: leftColumnName,
          rightFieldName: rightColumnName,
          leftTableId: join.leftTable,
          rightTableId: join.rightTable,
          joinId: join.id,
        } as JoinEdgeData,
      };
    });
  }, [formData.joins, getTableColumnsMap]);

  const [nodesState, setNodes, onNodesChange] = useNodesState<TableNode>([]);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(rawEdges);
  const { fitView } = useReactFlow();

  const syncGraphLayout = useCallback(
    (nodesInput: TableNode[], edgesInput: Edge[]) => {
      const layoutedNodes = getLayoutedElements(nodesInput, edgesInput, {
        direction: "LR",
      });

      const nodesWithConnectedFields = layoutedNodes.map((node) => {
        const nodeData = node.data as TableFieldNodeData;
        const connectedFields = getConnectedFieldsSet(
          edgesInput as Edge<JoinEdgeData>[],
          node.id,
        );

        return {
          ...node,
          data: {
            ...nodeData,
            connectedFields,
          },
        };
      });

      setNodes(nodesWithConnectedFields as TableNode[]);
      setEdges(edgesInput);

      setTimeout(() => {
        fitView({ padding: 0.18, duration: 280 });
      }, 50);
    },
    [fitView, setEdges, setNodes],
  );

  const applyLayout = useCallback(() => {
    syncGraphLayout(nodesState, edgesState);
  }, [edgesState, nodesState, syncGraphLayout]);

  useEffect(() => {
    syncGraphLayout(rawNodes, rawEdges);
  }, [rawEdges, rawNodes, syncGraphLayout]);

  const isValidConnection = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) {
      return false;
    }

    if (!connection.sourceHandle || !connection.targetHandle) {
      return false;
    }

    const sourceInfo = parseHandleId(connection.sourceHandle);
    const targetInfo = parseHandleId(connection.targetHandle);

    if (!sourceInfo || !targetInfo) {
      return false;
    }

    if (sourceInfo.tableId === targetInfo.tableId) {
      return false;
    }

    return true;
  }, []);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!isValidConnection(connection)) {
        return;
      }

      const sourceInfo = parseHandleId(connection.sourceHandle!);
      const targetInfo = parseHandleId(connection.targetHandle!);

      if (!sourceInfo || !targetInfo) {
        return;
      }

      if (
        hasEdgeBetweenTables(
          rawEdges as Edge<JoinEdgeData>[],
          sourceInfo.tableId,
          targetInfo.tableId,
        )
      ) {
        toast.warning(
          `${getTableName(sourceInfo.tableId)} 与 ${getTableName(targetInfo.tableId)} 之间已存在关联关系`,
        );
        return;
      }

      onAddJoin({
        id: `join-${Date.now()}`,
        leftTable: sourceInfo.tableId,
        leftField: sourceInfo.columnId,
        joinType: "inner",
        rightTable: targetInfo.tableId,
        rightField: targetInfo.columnId,
      });
    },
    [getTableName, isValidConnection, onAddJoin, rawEdges],
  );

  const handleApplyDatasourceJoins = useCallback(() => {
    if (datasourceForeignKeyJoins.length === 0) {
      onReplaceJoins([]);
      toast.info("已清空当前关联，所选表之间没有可应用的数据库 Join 关系");
      return;
    }

    onReplaceJoins(
      datasourceForeignKeyJoins.map((join, index) => ({
        ...join,
        id: `join-${Date.now()}-${index}`,
      })),
    );

    toast.success(`已按数据库关系重建 ${datasourceForeignKeyJoins.length} 条 Join`);
  }, [datasourceForeignKeyJoins, onReplaceJoins]);

  const handleClearJoins = useCallback(() => {
    if (formData.joins.length === 0) {
      return;
    }

    onReplaceJoins([]);
    toast.success("已清空当前关联关系");
  }, [formData.joins.length, onReplaceJoins]);

  if (isSingleTable) {
    return (
      <div className={styles.emptyState}>
        <AlertCircle size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>无需配置关联</h3>
        <p className={styles.emptyText}>
          当前数据集只包含单个表，不需要配置表之间的关联关系。
        </p>
      </div>
    );
  }

  if (!selectedDatasource || selectedDatasource.tables?.length === 0) {
    return (
      <div className={styles.emptyState}>
        <AlertCircle size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>暂无数据源</h3>
        <p className={styles.emptyText}>
          请先在数据源与表步骤中选择数据源和表。
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <section className={styles.flowSection}>
        <div className={styles.flowHeader}>
          <div>
            <h3 className={styles.sectionTitle}>关联图</h3>
            <p className={styles.sectionDescription}>
              拖拽字段之间的连线来建立关联，默认入口表会在图中高亮显示。
            </p>
          </div>
        </div>

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
            <Panel position="top-right">
              <button className={styles.layoutButton} onClick={applyLayout}>
                <Layout size={16} />
                整理布局
              </button>
            </Panel>
          </ReactFlow>
        </div>
      </section>

      <JoinInfoPanel
        joins={formData.joins}
        tables={formData.tables}
        selectedDatasource={selectedDatasource}
        onUpdateJoin={onUpdateJoin}
        onRemoveJoin={onRemoveJoin}
        onApplyDatasourceJoins={handleApplyDatasourceJoins}
        onClearJoins={handleClearJoins}
        availableAutoJoinCount={datasourceForeignKeyJoins.length}
        pendingAutoJoinCount={datasourceForeignKeyJoins.length}
      />
    </div>
  );
};
