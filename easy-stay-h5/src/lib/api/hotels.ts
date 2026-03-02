import { request } from "./client";
import type { Hotel, HotelQueryParams, PagedResult, Room, Tag } from "./types";

interface BackendOkResponse<T> {
  code: string;
  data: T;
}

type BackendHotelStatus = "auditing" | "approved" | "rejected" | "published" | "offline";

interface BackendRoomType {
  id: string;
  name: string;
  price: number;
  discount?: number;
  facilities?: string[];
  stock?: number;
}

interface BackendHotelDoc {
  _id: string;
  nameZh?: string;
  city?: string;
  address?: string;
  starLevel?: number;
  roomTypes?: BackendRoomType[];
  images?: string[];
  nearby?: string;
  facilities?: string[];
  tags?: Tag[];
  reviewScore?: number;
  status?: BackendHotelStatus;
  rejectReason?: string;
  updatedAt?: string;
  createdAt?: string;
}

interface BackendH5HotelListItem {
  id: string;
  name: string;
  city: string;
  address: string;
  starRating: number;
  images: string[];
  minPrice?: { amount: number; currency: string; unit: string };
  tags?: Tag[];
  auditStatus?: string;
}

interface BackendH5HotelListPayload {
  list: BackendH5HotelListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

function clampNumber(value: unknown) {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function toAuditStatus(status: BackendHotelStatus | undefined): Hotel["auditStatus"] {
  if (status === "published" || status === "approved") return "APPROVED";
  if (status === "rejected") return "REJECTED";
  return "PENDING";
}

function fallbackImages(images: unknown) {
  const list = Array.isArray(images) ? images.filter((x) => typeof x === "string" && x.trim()) : [];
  return list.length ? list : ["https://images.unsplash.com/photo-1566073771259-6a8506099945"];
}

function roomsFromRoomTypes(roomTypes: BackendRoomType[] | undefined): Room[] {
  const list = Array.isArray(roomTypes) ? roomTypes : [];
  return list
    .filter((room) => room && typeof room.id === "string")
    .map((room) => {
      const basePrice = clampNumber(room.price) ?? 0;
      const discount = clampNumber(room.discount) ?? 1;
      const finalPrice = Math.max(0, Math.round(basePrice * discount));
      return {
        id: room.id,
        name: room.name || "房型",
        price: finalPrice,
        breakfast: false,
        cancelPolicy: "可取消",
        stock: clampNumber(room.stock) ?? 0,
      };
    });
}

function minMaxPrice(rooms: Room[]) {
  if (!rooms.length) return { minPrice: 0, maxPrice: 0 };
  const prices = rooms.map((room) => room.price).filter((price) => Number.isFinite(price));
  if (!prices.length) return { minPrice: 0, maxPrice: 0 };
  return { minPrice: Math.min(...prices), maxPrice: Math.max(...prices) };
}

function tagIdsFromTags(tags: Tag[] | undefined) {
  const list = Array.isArray(tags) ? tags : [];
  return list.map((tag) => tag?.id).filter((id): id is string => typeof id === "string" && id.length > 0);
}

function hotelFromBackendDoc(doc: BackendHotelDoc): Hotel {
  const rooms = roomsFromRoomTypes(doc.roomTypes);
  const { minPrice, maxPrice } = minMaxPrice(rooms);
  const tagIds = tagIdsFromTags(doc.tags);

  return {
    id: doc._id,
    name: doc.nameZh || "未命名酒店",
    city: doc.city || "",
    district: doc.nearby || "",
    address: doc.address || "",
    description: doc.nearby || "",
    starRating: clampNumber(doc.starLevel) ?? 0,
    minPrice,
    maxPrice,
    auditStatus: toAuditStatus(doc.status),
    isOnline: doc.status === "published",
    offlineReason: doc.rejectReason || undefined,
    tagIds,
    facilities: Array.isArray(doc.facilities) ? doc.facilities.filter((x) => typeof x === "string") : [],
    images: fallbackImages(doc.images),
    rooms,
    updatedAt: doc.updatedAt || doc.createdAt || new Date(0).toISOString(),
  };
}

function hotelFromBackendListItem(item: BackendH5HotelListItem): Hotel {
  const minPrice = clampNumber(item.minPrice?.amount) ?? 0;
  const tagIds = tagIdsFromTags(item.tags);

  return {
    id: item.id,
    name: item.name || "未命名酒店",
    city: item.city || "",
    district: "",
    address: item.address || "",
    description: "",
    starRating: clampNumber(item.starRating) ?? 0,
    minPrice,
    maxPrice: minPrice,
    auditStatus: "APPROVED",
    isOnline: true,
    tagIds,
    facilities: [],
    images: fallbackImages(item.images),
    rooms: [],
    updatedAt: new Date(0).toISOString(),
  };
}

export async function getHotels(params: HotelQueryParams = {}): Promise<PagedResult<Hotel>> {
  const page = params._page ?? 1;
  const limit = params._limit ?? 10;

  // Translate json-server style query params to backend H5 API.
  const city = params.city?.trim() || undefined;
  const keyword = params.q?.trim() || undefined;
  const starRating = params.starRating;
  const minPrice = params.minPrice_gte;
  const maxPrice = params.maxPrice_lte;

  const res = await request<BackendOkResponse<BackendH5HotelListPayload>>("/api/h5/hotels", {
    query: {
      page,
      pageSize: limit,
      city,
      keyword,
      starRatings: starRating ? String(starRating) : undefined,
      minPrice,
      maxPrice,
    },
  });

  const payload = res.data.data;
  const list = payload?.list ?? [];
  const hotels = list.map(hotelFromBackendListItem);

  return {
    data: hotels,
    pagination: {
      total: payload?.total ?? hotels.length,
      page: payload?.page ?? page,
      limit: payload?.pageSize ?? limit,
    },
  };
}

export async function getHotelById(id: string): Promise<Hotel | null> {
  try {
    const res = await request<BackendOkResponse<{ hotel: BackendHotelDoc }>>(`/api/h5/hotels/${id}`);
    return hotelFromBackendDoc(res.data.data.hotel);
  } catch {
    return null;
  }
}
