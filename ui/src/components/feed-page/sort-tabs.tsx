"use client";

import { TabButtons } from "@/components/shared/toggle";

const FILTERS = [
  { value: "all" as const, label: "All" },
  { value: "result" as const, label: "Runs" },
  { value: "post" as const, label: "Posts" },
  { value: "claim" as const, label: "Claims" },
  { value: "skill" as const, label: "Skills" },
];

export type FilterKey = "all" | "result" | "post" | "claim" | "skill";

interface SortTabsProps {
  filter?: FilterKey;
  onFilterChange?: (filter: FilterKey) => void;
}

export function SortTabs({ filter = "all", onFilterChange }: SortTabsProps) {
  return <TabButtons value={filter} onChange={(v) => onFilterChange?.(v)} options={FILTERS} />;
}
