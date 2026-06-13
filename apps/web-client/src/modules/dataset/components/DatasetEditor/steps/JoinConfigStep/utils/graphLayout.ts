import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";

const DEFAULT_NODE_WIDTH = 160;
const DEFAULT_NODE_HEIGHT = 40;
const DEFAULT_FIELD_ROW_HEIGHT = 28;
const DEFAULT_NODE_SEPARATION = 120;
const DEFAULT_RANK_SEPARATION = 200;

interface LayoutOptions {
  direction?: "TB" | "LR" | "BT" | "RL";
  nodeWidth?: number;
  nodeSeparation?: number;
  rankSeparation?: number;
}

interface TableFieldNodeData {
  columns?: Array<{ columnName: string }>;
}

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {},
): Node[] => {
  const {
    direction = "LR",
    nodeWidth = DEFAULT_NODE_WIDTH,
    nodeSeparation = DEFAULT_NODE_SEPARATION,
    rankSeparation = DEFAULT_RANK_SEPARATION,
  } = options;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: nodeSeparation,
    ranksep: rankSeparation,
  });

  nodes.forEach((node) => {
    const nodeData = node.data as unknown as TableFieldNodeData;
    const height = nodeData?.columns?.length
      ? DEFAULT_NODE_HEIGHT + nodeData.columns.length * DEFAULT_FIELD_ROW_HEIGHT
      : DEFAULT_NODE_HEIGHT + DEFAULT_FIELD_ROW_HEIGHT * 3;
    dagreGraph.setNode(node.id, { width: nodeWidth, height: height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const isHorizontal = direction === "LR" || direction === "RL";

  const layoutedNodes = nodes.map((node) => {
    const nodeData = node.data as unknown as TableFieldNodeData;
    const height = nodeData?.columns?.length
      ? DEFAULT_NODE_HEIGHT + nodeData.columns.length * DEFAULT_FIELD_ROW_HEIGHT
      : DEFAULT_NODE_HEIGHT + DEFAULT_FIELD_ROW_HEIGHT * 3;

    const nodeWithPosition = dagreGraph.node(node.id);
    if (!nodeWithPosition) {
      return {
        ...node,
        position: { x: 0, y: 0 },
      };
    }
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return layoutedNodes;
};
