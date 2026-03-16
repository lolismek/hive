import { Run } from "@/types/api";
import { resolveId } from "@/lib/run-utils";

export interface TreeNode {
  run: Run;
  children: TreeNode[];
  x: number;
  y: number;
}

export interface TreeLayout {
  nodes: TreeNode[];
  edges: { parent: TreeNode; child: TreeNode }[];
  width: number;
  height: number;
}

export function buildTree(runs: Run[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];
  for (const run of runs) map.set(run.id, { run, children: [], x: 0, y: 0 });
  for (const run of runs) {
    const node = map.get(run.id)!;
    const parentFullId = run.parent_id ? resolveId(run.parent_id, map.keys()) : undefined;
    if (parentFullId && map.has(parentFullId)) map.get(parentFullId)!.children.push(node);
    else roots.push(node);
  }
  for (const node of map.values()) {
    node.children.sort((a, b) => new Date(a.run.created_at).getTime() - new Date(b.run.created_at).getTime());
  }
  return roots;
}

export function layoutTree(
  roots: TreeNode[],
  nodeW: number,
  nodeH: number,
  gapX: number,
  gapY: number,
): TreeLayout {
  const allNodes: TreeNode[] = [];
  let currentX = 0;

  function layout(node: TreeNode, depth: number) {
    node.y = depth * (nodeH + gapY);

    if (node.children.length === 0) {
      node.x = currentX;
      currentX += nodeW + gapX;
      allNodes.push(node);
      return;
    }

    for (const child of node.children) {
      layout(child, depth + 1);
    }

    const firstChild = node.children[0];
    const lastChild = node.children[node.children.length - 1];
    node.x = (firstChild.x + lastChild.x) / 2;
    allNodes.push(node);
  }

  for (const root of roots) layout(root, 0);

  const edges: { parent: TreeNode; child: TreeNode }[] = [];
  function walk(node: TreeNode) {
    for (const c of node.children) {
      edges.push({ parent: node, child: c });
      walk(c);
    }
  }
  for (const r of roots) walk(r);

  const maxX = currentX;
  const maxY = Math.max(...allNodes.map((n) => n.y)) + nodeH;
  return { nodes: allNodes, edges, width: maxX + 20, height: maxY + 20 };
}
