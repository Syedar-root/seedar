import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";
import type { LayoutOptions } from "../types";

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 60;
const DEFAULT_NODE_SEPARATION = 80;
const DEFAULT_RANK_SEPARATION = 150;

export const getLayoutedElements = <
  T extends Record<string, unknown>,
  U extends Record<string, unknown>,
>(
  nodes: Node<T>[],
  edges: Edge<U>[],
  options: LayoutOptions = {},
): Node<T>[] => {
  const {
    direction = "LR",
    nodeWidth = DEFAULT_NODE_WIDTH,
    nodeHeight = DEFAULT_NODE_HEIGHT,
    nodeSeparation = DEFAULT_NODE_SEPARATION,
    rankSeparation = DEFAULT_RANK_SEPARATION,
  } = options;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === "LR" || direction === "RL";
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: nodeSeparation,
    ranksep: rankSeparation,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
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
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return layoutedNodes;
};
