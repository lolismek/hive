interface ScoreProps {
  value: number | null | undefined;
  decimals?: number;
  className?: string;
}

export function Score({ value, decimals = 3, className = "" }: ScoreProps) {
  return (
    <span className={`font-[family-name:var(--font-ibm-plex-mono)] font-medium tabular-nums ${className}`}>
      {value != null ? value.toFixed(decimals) : "\u2014"}
    </span>
  );
}
