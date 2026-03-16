import { Run } from "@/types/api";

/** Build a Map from full run ID → Run */
export function buildRunMap(runs: Run[]): Map<string, Run> {
  const map = new Map<string, Run>();
  for (const r of runs) map.set(r.id, r);
  return map;
}

/** Resolve a run ID that might be a SHA prefix */
export function resolveRun(id: string, map: Map<string, Run>): Run | undefined {
  const exact = map.get(id);
  if (exact) return exact;
  for (const [fullId, run] of map) {
    if (fullId.startsWith(id)) return run;
  }
  return undefined;
}

/** Resolve a potentially-prefixed ID to the full ID, using a set of known full IDs */
export function resolveId(id: string, fullIds: Iterable<string>): string | undefined {
  for (const fullId of fullIds) {
    if (fullId === id || fullId.startsWith(id)) return fullId;
  }
  return undefined;
}
