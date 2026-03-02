import type { Tag } from "../lib/api/types";

interface TagListProps {
  tags: Tag[];
}

export function TagList({ tags }: TagListProps) {
  if (!tags.length) return null;

  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <span className="tag-chip" key={tag.id}>
          {tag.name}
        </span>
      ))}
    </div>
  );
}
