"use client";

import { useMemo } from "react";
import { Run } from "@/types/api";
import { getAgentColor } from "@/lib/agent-colors";
import { buildTree, layoutTree } from "@/lib/tree-layout";
import { resolveRun, buildRunMap } from "@/lib/run-utils";

interface EvolutionTreeProps {
  runs: Run[];
  onRunClick?: (run: Run) => void;
}

const NODE_W = 220;
const NODE_H = 68;
const GAP_X = 28;
const GAP_Y = 56;

function getBestLineage(runs: Run[]): { ids: Set<string>; chains: Set<string>[] } {
  if (runs.length === 0) return { ids: new Set(), chains: [] };

  const scored = runs.filter((r) => r.score !== null);
  if (scored.length === 0) return { ids: new Set(), chains: [] };

  const bestScore = Math.max(...scored.map((r) => r.score!));
  const winners = scored.filter((r) => r.score === bestScore);
  const byId = buildRunMap(runs);
  const ids = new Set<string>();
  const chains: Set<string>[] = [];

  for (const winner of winners) {
    const chain = new Set<string>();
    let current: Run | undefined = winner;
    while (current) {
      ids.add(current.id);
      chain.add(current.id);
      current = current.parent_id ? resolveRun(current.parent_id, byId) : undefined;
    }
    chains.push(chain);
  }

  return { ids, chains };
}

export function EvolutionTree({ runs, onRunClick }: EvolutionTreeProps) {
  const { nodes, edges, width, height } = useMemo(() => {
    const roots = buildTree(runs);
    return layoutTree(roots, NODE_W, NODE_H, GAP_X, GAP_Y);
  }, [runs]);

  const { ids: bestLineage, chains: bestChains } = useMemo(() => getBestLineage(runs), [runs]);

  return (
    <div className="overflow-auto h-full w-full">
      <svg width={width} height={height} className="mx-auto block">
        <g transform="translate(10, 10)">
          {/* Edges */}
          {edges.map((e, i) => {
            const x1 = e.parent.x + NODE_W / 2;
            const y1 = e.parent.y + NODE_H;
            const x2 = e.child.x + NODE_W / 2;
            const y2 = e.child.y;
            const my = (y1 + y2) / 2;
            const inLineage = bestChains.some((c) => c.has(e.parent.run.id) && c.has(e.child.run.id));
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
