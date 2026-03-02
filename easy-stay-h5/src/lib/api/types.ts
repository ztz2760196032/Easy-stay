export type AuditStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Room {
  id: string;
  name: string;
  price: number;
  breakfast: boolean;
  cancelPolicy: string;
  stock: number;
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  description: string;
  starRating: number;
  minPrice: number;
  maxPrice: number;
  auditStatus: AuditStatus;
  isOnline: boolean;
  offlineReason?: string;
  tagIds: string[];
  facilities: string[];
  images: string[];
  rooms: Room[];
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface HotelQueryParams {
  _page?: number;
  _limit?: number;
  q?: string;
  city?: string;
  city_like?: string;
  keyword_like?: string;
  tagIds_like?: string;
  starRating?: number;
  minPrice_gte?: number;
  maxPrice_lte?: number;
  auditStatus?: AuditStatus;
  isOnline?: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export interface PagedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}
