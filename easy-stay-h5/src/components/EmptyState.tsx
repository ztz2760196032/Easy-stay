interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  tone?: "default" | "error";
}

export function EmptyState({ title, description, actionText, onAction, tone = "default" }: EmptyStateProps) {
  return (
    <div className={`empty-state card ${tone === "error" ? "is-error" : ""}`}>
      <div className="empty-state-icon" aria-hidden>
        {tone === "error" ? "!" : "O"}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionText && onAction ? (
        <button className="btn-secondary" onClick={onAction} type="button">
          {actionText}
        </button>
      ) : null}
    </div>
  );
}
