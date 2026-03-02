import type { Hotel } from "../lib/api/types";

export function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

export function matchesKeyword(hotel: Hotel, keyword: string) {
  if (!keyword) return true;
  const source = `${hotel.name} ${hotel.city} ${hotel.district} ${hotel.address} ${hotel.description}`.toLowerCase();
  return source.includes(normalizeKeyword(keyword));
}

export function matchesTag(hotel: Hotel, tagId?: string) {
  if (!tagId) return true;
  return hotel.tagIds.includes(tagId);
}

export function isBookableHotel(hotel: Hotel) {
  return hotel.auditStatus === "APPROVED" && hotel.isOnline;
}
