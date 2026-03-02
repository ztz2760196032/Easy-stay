import { request } from "./client";
import type { Tag } from "./types";

interface BackendOkResponse<T> {
  code: string;
  data: T;
}

interface BackendTagList {
  list: Tag[];
}

function uniqTags(tags: Tag[]) {
  const map = new Map<string, Tag>();
  tags.forEach((tag) => {
    if (!tag?.id) return;
    if (!map.has(tag.id)) map.set(tag.id, tag);
  });
  return Array.from(map.values());
}

export async function getTags(): Promise<Tag[]> {
  // Prefer backend tag endpoint; fall back to extracting from the hotel list for compatibility.
  try {
    const res = await request<BackendOkResponse<BackendTagList>>("/api/h5/tags");
    const list = res.data?.data?.list ?? [];
    return uniqTags(list);
  } catch {
    const res = await request<BackendOkResponse<{ list: Array<{ tags?: Tag[] }> }>>("/api/h5/hotels", {
      query: { page: 1, pageSize: 200 },
    });
    const list = res.data?.data?.list ?? [];
    const extracted = list.flatMap((item) => item.tags ?? []);
    return uniqTags(extracted);
  }
}

