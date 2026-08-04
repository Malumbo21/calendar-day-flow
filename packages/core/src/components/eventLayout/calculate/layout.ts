import { LAYOUT_CONFIG } from '@/components/eventLayout/constants';
import {
  LayoutNode,
  LayoutCalculationParams,
  LayoutWeekEvent,
} from '@/components/eventLayout/types';
import {
  getStartHour,
  getEndHour,
  shouldBeParallel,
  eventsOverlap,
} from '@/components/eventLayout/utils';
import { EventLayout } from '@/types';

function getIndentStepPercent(viewType?: 'week' | 'day'): number {
  return viewType === 'day' ? 0.5 : 2.5;
}

function calculateEventImportance(event: LayoutWeekEvent): number {
  const duration = getEndHour(event) - getStartHour(event);
  return Math.max(0.1, Math.min(1.0, duration / 4));
}

function findBranchRootIndent(
  node: LayoutNode,
  viewType?: 'week' | 'day'
): number | null {
  let current = node;
  while (current.parent && current.parent.depth > 0) current = current.parent;
  return current.depth === 1
    ? current.depth * getIndentStepPercent(viewType)
    : null;
}

function shouldChildrenBeParallel(childEvents: LayoutWeekEvent[]): boolean {
  if (childEvents.length < 2) return false;
  for (let i = 0; i < childEvents.length; i++) {
    for (let j = i + 1; j < childEvents.length; j++) {
      if (shouldBeParallel(childEvents[i], childEvents[j], LAYOUT_CONFIG))
        return true;
    }
  }
  return false;
}

function partitionIntoOverlappingClusters(nodes: LayoutNode[]): LayoutNode[][] {
  if (nodes.length === 0) return [];
  const clusters: LayoutNode[][] = [];
  const visited = new Set<string>();

  for (const node of nodes) {
    if (visited.has(node.event.id)) continue;

    const cluster: LayoutNode[] = [node];
    const queue: LayoutNode[] = [node];
    visited.add(node.event.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const other of nodes) {
        if (visited.has(other.event.id)) continue;
        if (eventsOverlap(current.event, other.event)) {
          cluster.push(other);
          queue.push(other);
          visited.add(other.event.id);
        }
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

function processChildrenLayout(
  children: LayoutNode[],
  parentLeft: number,
  parentWidth: number,
  layoutMap: Map<string, EventLayout>,
  params: LayoutCalculationParams = {}
): void {
  if (children.length === 0) return;

  const sortedChildren = [...children].toSorted(
    (a, b) =>
      getEndHour(b.event) -
      getStartHour(b.event) -
      (getEndHour(a.event) - getStartHour(a.event))
  );

  if (sortedChildren.length === 1) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    calculateNodeLayoutWithVirtualParallel(
      sortedChildren[0],
      parentLeft,
      parentWidth,
      layoutMap,
      params
    );
    return;
  }

  const clusters = partitionIntoOverlappingClusters(sortedChildren);

  for (const cluster of clusters) {
    if (cluster.length === 1) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      calculateNodeLayoutWithVirtualParallel(
        cluster[0],
        parentLeft,
        parentWidth,
        layoutMap,
        params
      );
    } else if (shouldChildrenBeParallel(cluster.map(c => c.event))) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      calculateParallelChildrenLayout(
        cluster,
        parentLeft,
        parentWidth,
        layoutMap,
        params
      );
    } else {
      cluster.forEach(child =>
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        calculateNodeLayoutWithVirtualParallel(
          child,
          parentLeft,
          parentWidth,
          layoutMap,
          params
        )
      );
    }
  }
}

function calculateNodeLayoutWithVirtualParallel(
  node: LayoutNode,
  baseLeft: number,
  availableWidth: number,
  layoutMap: Map<string, EventLayout>,
  params: LayoutCalculationParams = {}
): void {
  const indentStep = getIndentStepPercent(params.viewType);
  let finalIndentOffset = node.depth * indentStep;

  if (node.isProcessed) {
    const branchRootIndent = findBranchRootIndent(node, params.viewType);
    if (branchRootIndent !== null) finalIndentOffset = branchRootIndent;
  }

  // Standard indentation for nested events, but remove the "magic" offsets
  // that cause inconsistent alignment across days.
  const nodeLeft = baseLeft + finalIndentOffset;
  const usedLeftSpace = finalIndentOffset;
  let nodeWidth = availableWidth - usedLeftSpace;

  if (nodeLeft + nodeWidth > baseLeft + availableWidth) {
    nodeWidth = baseLeft + availableWidth - nodeLeft;
  }

  layoutMap.set(node.event.id, {
    id: node.event.id,
    left: nodeLeft,
    width: nodeWidth,
    zIndex: node.depth,
    level: node.depth,
    isPrimary: node.depth === 0,
    indentOffset: (finalIndentOffset * (params.containerWidth || 320)) / 100,
    importance: calculateEventImportance(node.event),
  });

  if (node.children.length > 0) {
    processChildrenLayout(
      node.children,
      nodeLeft,
      nodeWidth,
      layoutMap,
      params
    );
  }
}

function calculateParallelChildrenLayout(
  children: LayoutNode[],
  parentLeft: number,
  parentWidth: number,
  layoutMap: Map<string, EventLayout>,
  params: LayoutCalculationParams = {}
): void {
  const childCount = children.length;
  const firstChildDepth = children[0].depth;
  const indentStep = getIndentStepPercent(params.viewType);
  const childIndentOffset = firstChildDepth * indentStep;

  const childrenStartLeft = parentLeft + childIndentOffset;
  const usedLeftSpace = childIndentOffset;
  const childrenAvailableWidth = parentWidth - usedLeftSpace;

  if (childrenAvailableWidth <= 0) {
    children.forEach(child =>
      calculateNodeLayoutWithVirtualParallel(
        child,
        parentLeft,
        parentWidth,
        layoutMap,
        params
      )
    );
    return;
  }

  const adjustedMargin = LAYOUT_CONFIG.MARGIN_BETWEEN;
  const childWidth =
    (childrenAvailableWidth - adjustedMargin * (childCount - 1)) / childCount;

  children.forEach((child, index) => {
    const childLeft = childrenStartLeft + index * (childWidth + adjustedMargin);
    layoutMap.set(child.event.id, {
      id: child.event.id,
      left: childLeft,
      width: childWidth,
      zIndex: child.depth,
      level: child.depth,
      isPrimary: child.depth === 0,
      indentOffset: (childIndentOffset * (params.containerWidth || 320)) / 100,
      importance: calculateEventImportance(child.event),
    });

    if (child.children.length > 0) {
      processChildrenLayout(
        child.children,
        childLeft,
        childWidth,
        layoutMap,
        params
      );
    }
  });
}

/**
 * Calculate layout from nested structure
 */
export function calculateLayoutFromStructure(
  rootNodes: LayoutNode[],
  layoutMap: Map<string, EventLayout>,
  params: LayoutCalculationParams = {}
): void {
  const edgeMargin =
    params.viewType === 'day' ? 0 : LAYOUT_CONFIG.EDGE_MARGIN_PERCENT;
  const totalWidth = 100 - edgeMargin;

  if (rootNodes.length === 1) {
    calculateNodeLayoutWithVirtualParallel(
      rootNodes[0],
      0,
      totalWidth,
      layoutMap,
      params
    );
  } else if (rootNodes.length > 1) {
    const nodeCount = rootNodes.length;
    const totalMargin = LAYOUT_CONFIG.MARGIN_BETWEEN * (nodeCount - 1);
    const nodeWidth = (totalWidth - totalMargin) / nodeCount;

    rootNodes.forEach((node, index) => {
      const left = index * (nodeWidth + LAYOUT_CONFIG.MARGIN_BETWEEN);
      calculateNodeLayoutWithVirtualParallel(
        node,
        left,
        Math.max(nodeWidth, LAYOUT_CONFIG.MIN_WIDTH),
        layoutMap,
        params
      );
    });
  }
}
