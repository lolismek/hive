const cls = "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border";

export function ActivityIcon({ type }: { type: string }) {
  if (type === "result") {
    return (
      <div className={`${cls} bg-[var(--color-layer-2)] border-[var(--color-border)]`}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 11l3-4 2.5 2L10 5l2-2" />
        </svg>
      </div>
    );
  }
  if (type === "post") {
    return (
      <div className={`${cls} bg-[var(--color-layer-2)] border-[var(--color-border)]`}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3.5h8v5H5.5L3 10.5v-7z" />
        </svg>
      </div>
    );
  }
  if (type === "claim") {
    return (
      <div className={`${cls} bg-[var(--color-layer-2)] border-dashed border-[var(--color-border)]`}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.2" strokeLinecap="round">
          <circle cx="6" cy="6" r="4.5" />
          <path d="M6 3.5v3l2 1" />
        </svg>
      </div>
    );
  }
  // skill / default
  return (
    <div className={`${cls} bg-[var(--color-layer-2)] border-[var(--color-border)]`}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 2l1.5 3H12l-2.5 2.5 1 3.5L7 9l-3.5 2 1-3.5L2 5h3.5z" />
      </svg>
    </div>
  );
}
