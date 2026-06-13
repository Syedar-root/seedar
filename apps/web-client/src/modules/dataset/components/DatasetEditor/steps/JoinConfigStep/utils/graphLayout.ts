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

interface ColumnMeta {
  columnId: string;
  columnName?: string;
}

interface TableFieldNodeData {
  columns?: ColumnMeta[];
}

/** 将 handle id 中的 columnId 提取出来（格式: tableId:columnId:source|target:columnName） */
const parseColumnIdFromHandle = (
  handleId: string | null | undefined,
): string | undefined => {
  if (!handleId) return undefined;
  return handleId.split(":")[1];
};

/** 计算节点内某个字段的 y 偏移（字段行中心相对于节点顶部） */
const fieldCenterY = (fieldIndex: number): number =>
  DEFAULT_NODE_HEIGHT + fieldIndex * DEFAULT_FIELD_ROW_HEIGHT + DEFAULT_FIELD_ROW_HEIGHT / 2;

/** 获取节点高度 */
const getNodeHeight = (nodeData?: TableFieldNodeData): number => {
  const colCount = nodeData?.columns?.length || 3;
  return DEFAULT_NODE_HEIGHT + colCount * DEFAULT_FIELD_ROW_HEIGHT;
};

/**
 * 对 dagre 布局结果做 barycenter（重心）后处理：
 * 将同一 rank 内的节点按与相邻 rank 节点的连线字段位置重排序，
 * 减少因字段顺序不一致导致的连线交叉。
 */
const applyBarycenterOrdering = (
  layoutedNodes: Node[],
  edges: Edge[],
  isHorizontal: boolean,
): Node[] => {
  if (layoutedNodes.length <= 1 || edges.length === 0) {
    return layoutedNodes;
  }

  // 1. 建立 columnId → fieldIndex 的索引
  const fieldIndexByNode = new Map<string, Map<string, number>>();
  for (const node of layoutedNodes) {
    const columns = (node.data as TableFieldNodeData | undefined)?.columns || [];
    const idxMap = new Map<string, number>();
    columns.forEach((col, idx) => {
      if (col.columnId) idxMap.set(col.columnId, idx);
    });
    fieldIndexByNode.set(node.id, idxMap);
  }

  // 2. 按 rank（x 坐标）分组
  const POS_THRESHOLD = 20; // 同一 rank 的 x 偏移容差
  const rankBuckets = new Map<number, Node[]>();
  for (const node of layoutedNodes) {
    const pos = Math.round(
      (isHorizontal ? node.position.x : node.position.y) / POS_THRESHOLD,
    );
    if (!rankBuckets.has(pos)) rankBuckets.set(pos, []);
    rankBuckets.get(pos)!.push(node);
  }

  // 3. 对每个 rank（≥2 个节点时）做 barycenter 排序
  const reorderedNodes: Node[] = [];
  const sortedRanks = [...rankBuckets.keys()].sort((a, b) => a - b);

  for (const rankKey of sortedRanks) {
    const nodesInRank = rankBuckets.get(rankKey)!;
    if (nodesInRank.length <= 1) {
      reorderedNodes.push(...nodesInRank);
      continue;
    }

    // 为每个节点计算 barycenter
    const withBarycenter = nodesInRank.map((node) => {
      const connectedEdges = edges.filter(
        (e) => e.source === node.id || e.target === node.id,
      );

      if (connectedEdges.length === 0) {
        return { node, barycenter: node.position.y };
      }

      let sumY = 0;
      let count = 0;

      for (const edge of connectedEdges) {
        const isSource = edge.source === node.id;
        const otherId = isSource ? edge.target : edge.source;
        const otherNode = layoutedNodes.find((n) => n.id === otherId);
        if (!otherNode) continue;

        // 获取本端字段索引
        const myHandle = isSource ? edge.sourceHandle : edge.targetHandle;
        const myColId = parseColumnIdFromHandle(myHandle);
        const myIdxMap = fieldIndexByNode.get(node.id);
        const myFieldIdx = myColId ? myIdxMap?.get(myColId) : undefined;

        // 获取对端字段索引
        const otherHandle = isSource ? edge.targetHandle : edge.sourceHandle;
        const otherColId = parseColumnIdFromHandle(otherHandle);
        const otherIdxMap = fieldIndexByNode.get(otherNode.id);
        const otherFieldIdx = otherColId ? otherIdxMap?.get(otherColId) : undefined;

        if (otherFieldIdx === undefined) continue;

        // 对端字段在画布上的绝对 y 坐标
        const otherFieldAbsY = isHorizontal
          ? otherNode.position.y + fieldCenterY(otherFieldIdx)
          : otherNode.position.x + DEFAULT_NODE_WIDTH / 2;

        // 理想的本节点位置 = 对端字段 y - 本端字段相对偏移
        const myFieldOffset =
          myFieldIdx !== undefined ? fieldCenterY(myFieldIdx) : getNodeHeight(node.data as TableFieldNodeData | undefined) / 2;

        sumY += otherFieldAbsY - myFieldOffset;
        count++;
      }

      return {
        node,
        barycenter: count > 0 ? sumY / count : node.position.y,
      };
    });

    // 按 barycenter 排序
    withBarycenter.sort((a, b) => a.barycenter - b.barycenter);

    // 重新分配 y 位置（保持节点间最小间距）
    const MIN_GAP = 32;
    const sortedNodes = withBarycenter.map((item) => item.node);
    let cursorY = sortedNodes[0].position.y;

    for (const node of sortedNodes) {
      const h = getNodeHeight(node.data as TableFieldNodeData | undefined);
      node.position.y = cursorY;
      cursorY += h + MIN_GAP;
    }

    reorderedNodes.push(...sortedNodes);
  }

  return reorderedNodes;
};

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
    const height = getNodeHeight(nodeData);
    dagreGraph.setNode(node.id, { width: nodeWidth, height: height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const isHorizontal = direction === "LR" || direction === "RL";

  const layoutedNodes = nodes.map((node) => {
    const nodeData = node.data as unknown as TableFieldNodeData;
    const height = getNodeHeight(nodeData);

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

  return applyBarycenterOrdering(layoutedNodes, edges, isHorizontal);
};
