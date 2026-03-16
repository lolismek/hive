"use client";

import { useMemo } from "react";
import { Run } from "@/types/api";
import { getAgentColor } from "@/lib/agent-colors";
import { buildTree, layoutTree } from "@/lib/tree-layout";

interface EvolutionTreeProps {
  runs: Run[];
  onRunClick?: (run: Run) => void;
}

const NODE_W = 220;
const NODE_H = 68;
const GAP_X = 28;
const GAP_Y = 56;

function getBestLineage(runs: Run[]): Set<string> {
  const lineage = new Set<string>();
  if (runs.length === 0) return lineage;

  const scored = runs.filter((r) => r.score !== null);
  if (scored.length === 0) return lineage;

  const best = scored.reduce((a, b) => (a.score! >= b.score! ? a : b));
  const byId = new Map(runs.map((r) => [r.id, r]));

  let current: Run | undefined = best;
  while (current) {
    lineage.add(current.id);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }

  return lineage;
}

export function EvolutionTree({ runs, onRunClick }: EvolutionTreeProps) {
  const { nodes, edges, width, height } = useMemo(() => {
    const roots = buildTree(runs);
    return layoutTree(roots, NODE_W, NODE_H, GAP_X, GAP_Y);
  }, [runs]);

  const bestLineage = useMemo(() => getBestLineage(runs), [runs]);

  return (
    <div className="overflow-x-auto overflow-y-auto h-full w-full flex items-start justify-center">
      <svg width={width} height={height}>
        <g transform="translate(10, 10)">
          {/* Edges */}
          {edges.map((e, i) => {
            const x1 = e.parent.x + NODE_W / 2;
            const y1 = e.parent.y + NODE_H;
            const x2 = e.child.x + NODE_W / 2;
            const y2 = e.child.y;
            const my = (y1 + y2) / 2;
            const inLineage = bestLineage.has(e.parent.run.id) && bestLineage.has(e.child.run.id);
            return (
              <path key={i} d={`M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`}
                fill="none"
                stroke={inLineage ? "#3f72af" : "#e5e7eb"}
                strokeWidth={inLineage ? 2 : 1.5} />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const inLineage = bestLineage.has(node.run.id);
            return (
              <g key={node.run.id} transform={`translate(${node.x}, ${node.y})`}
                onClick={() => onRunClick?.(node.run)} className="cursor-pointer">
                <rect width={NODE_W} height={NODE_H} rx={8}
                  fill={inLineage ? "#eff6ff" : "#ffffff"}
                  stroke={inLineage ? "#3f72af" : "#e5e7eb"}
                  strokeWidth={inLineage ? 1.5 : 1} />
                <text x={NODE_W / 2} y={24} fill="#111827" fontSize={12} fontFamily="'IBM Plex Mono', monospace" textAnchor="middle">
                  {node.run.tldr.length > 24 ? node.run.tldr.slice(0, 24) + "..." : node.run.tldr}
                </text>
                <text x={NODE_W / 2} y={44} fill="#111827" fontSize={16} fontFamily="'DM Sans', sans-serif" fontWeight={600} textAnchor="middle">
                  {node.run.agent_id.length > 20 ? node.run.agent_id.slice(0, 20) + "…" : node.run.agent_id}
                </text>
                {node.run.score !== null && (
                  <text x={NODE_W / 2} y={61}
                    fill={inLineage ? "#3f72af" : "#6b7280"}
                    fontSize={10}
                    fontWeight={inLineage ? 600 : 400}
                    fontFamily="'IBM Plex Mono', monospace" textAnchor="middle">
                    {node.run.score.toFixed(3)}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
