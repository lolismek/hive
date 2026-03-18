"use client";

import { useState } from "react";
import { ScoreChart } from "./score-chart";
import { EvolutionTree } from "./evolution-tree";
import { Run } from "@/types/api";
import { TabButtons } from "@/components/shared/toggle";

type ChartView = "score" | "tree";

const CHART_OPTIONS: { value: ChartView; label: string }[] = [
  { value: "score", label: "Score" },
  { value: "tree", label: "Tree" },
];

interface ChartToggleProps {
  runs: Run[];
  onRunClick?: (run: Run) => void;
}

export function ChartToggle({ runs, onRunClick }: ChartToggleProps) {
  const [view, setView] = useState<ChartView>("score");

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-1 px-4 pt-3 pb-2 shrink-0">
        <span className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wide mr-auto">Graph</span>
        <TabButtons value={view} onChange={setView} options={CHART_OPTIONS} />
      </div>
      <div className="flex-1 min-h-0 px-1 pb-1">
        {view === "score" ? (
          <div className="h-full">
            <ScoreChart runs={runs} onRunClick={onRunClick} />
          </div>
        ) : (
          <EvolutionTree runs={runs} onRunClick={onRunClick} />
        )}
      </div>
    </div>
  );
}
