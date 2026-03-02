interface SkeletonProps {
  lines?: number;
  compact?: boolean;
}

export function Skeleton({ lines = 3, compact = false }: SkeletonProps) {
  return (
    <div className={`skeleton-card ${compact ? "compact" : ""}`} aria-hidden>
      <div className="skeleton-cover" />
      <div className="skeleton-lines">
        {Array.from({ length: lines }).map((_, index) => (
          <div className="skeleton-line" key={index} />
        ))}
      </div>
    </div>
  );
}
