import type { Tag } from "../lib/api/types";

export interface FilterDraft {
  star: string;
  min: string;
  max: string;
  tag: string;
}

interface FilterDrawerProps {
  open: boolean;
  draft: FilterDraft;
  tags: Tag[];
  onDraftChange: (next: FilterDraft) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}

export function FilterDrawer({ open, draft, tags, onDraftChange, onApply, onReset, onClose }: FilterDrawerProps) {
  if (!open) return null;

  return (
    <div className="drawer-mask" onClick={onClose} role="presentation">
      <div className="drawer-panel" onClick={(event) => event.stopPropagation()} role="presentation">
        <h3>筛选条件</h3>
        <label>
          星级
          <select onChange={(event) => onDraftChange({ ...draft, star: event.target.value })} value={draft.star}>
            <option value="">不限</option>
            {[3, 4, 5].map((star) => (
              <option key={star} value={star}>
                {star} 星
              </option>
            ))}
          </select>
        </label>

        <div className="field-grid">
          <label>
            最低价
            <input
              onChange={(event) => onDraftChange({ ...draft, min: event.target.value })}
              placeholder="如 300"
              type="number"
              value={draft.min}
            />
          </label>
          <label>
            最高价
            <input
              onChange={(event) => onDraftChange({ ...draft, max: event.target.value })}
              placeholder="如 900"
              type="number"
              value={draft.max}
            />
          </label>
        </div>

        <label>
          标签
          <select onChange={(event) => onDraftChange({ ...draft, tag: event.target.value })} value={draft.tag}>
            <option value="">不限</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>

        <div className="drawer-actions">
          <button className="btn-secondary" onClick={onReset} type="button">
            重置
          </button>
          <button className="btn-primary" onClick={onApply} type="button">
            应用筛选
          </button>
        </div>
      </div>
    </div>
  );
}
