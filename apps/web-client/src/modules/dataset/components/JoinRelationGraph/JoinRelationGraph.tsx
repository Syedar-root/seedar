import { useMemo, useEffect, useState, useCallback } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TableNode } from "./components/TableNode";
import { JoinEdge } from "./components/JoinEdge";
import { useGraphData } from "./hooks/useGraphData";
import { getLayoutedElements } from "./utils/graphLayout";
import type { FlowNode, FlowEdge, TableNodeData, JoinEdgeData } from "./types";
import type {
  DatasetJoinResponse,
  DatasetTableResponse,
  DatasetFieldResponse,
} from "#pkg/seedar/types";
import styles from "./JoinRelationGraph.module.scss";

const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

const edgeTypes: EdgeTypes = {
  joinEdge: JoinEdge,
};

interface JoinRelationGraphProps {
  joins: DatasetJoinResponse[];
  tables: DatasetTableResponse[];
  fields: DatasetFieldResponse[];
  mainTableId?: number;
  direction?: "TB" | "LR" | "BT" | "RL";
}

export const JoinRelationGraph = ({
  joins,
  tables,
  fields,
  mainTableId,
  direction = "LR",
}: JoinRelationGraphProps) => {
  const { nodes: rawNodes, edges } = useGraphData({
    joins,
    tables,
    fields,
    mainTableId,
    direction,
  });

  const nodes = useMemo(
    () => getLayoutedElements(rawNodes, edges, { direction }),
    [rawNodes, edges, direction],
  );

  const [nodesState, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const edgesWithState = useMemo((): FlowEdge[] => {
    return edges.map((edge) => {
      const isSelected = selectedEdgeId === edge.id;
      const isRelatedToSelectedTable =
        selectedTableId !== null &&
        (edge.source === selectedTableId || edge.target === selectedTableId);
      return {
        ...edge,
        data: {
          ...edge.data,
          selected: isSelected || isRelatedToSelectedTable,
        },
      } as FlowEdge;
    });
  }, [edges, selectedEdgeId, selectedTableId]);

  useEffect(() => {
    setNodes(nodes);
    setEdges(edgesWithState);
  }, [nodes, edgesWithState, setNodes, setEdges]);

  const handleEdgeClick = useCallback(
    (_event: unknown, edge: FlowEdge) => {
      if (selectedEdgeId === edge.id) {
        setSelectedEdgeId(null);
      } else {
        setSelectedEdgeId(edge.id);
        setSelectedTableId(null);
      }
    },
    [selectedEdgeId],
  );

  const handleNodeClick = useCallback(
    (_event: unknown, node: FlowNode) => {
      if (selectedTableId === node.id) {
        setSelectedTableId(null);
      } else {
        setSelectedTableId(node.id);
        setSelectedEdgeId(null);
      }
    },
    [selectedTableId],
  );

  const handlePaneClick = useCallback(() => {
    setSelectedEdgeId(null);
    setSelectedTableId(null);
  }, []);

  if (!tables || tables.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>暂无表数据</div>
      </div>
    );
  }

  if (!joins || joins.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>暂无关联关系</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ReactFlow<FlowNode, FlowEdge>
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeClick={handleEdgeClick}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        defaultEdgeOptions={{
          animated: false,
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls position="bottom-right" />
        <MiniMap
          nodeColor={(node) => {
            if (node.data?.isMainTable) {
              return "#f59e0b";
            }
            return "#e2e8f0";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
};
