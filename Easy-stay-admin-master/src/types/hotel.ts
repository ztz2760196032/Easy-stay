export type Role = 'merchant' | 'admin';

export type HotelStatus = 'auditing' | 'approved' | 'rejected' | 'published' | 'offline';

export interface Tag {
  id: string;
  name: string;
}

export interface RoomType {
  id: string;
  name: string;
  price: number;
  discount?: number;
  bedCount?: number;
  facilities?: string[];
  stock?: number;
}

// Frontend-friendly Hotel shape (id maps to backend _id).
export interface Hotel {
  id: string;
  merchantId: string;
  nameZh: string;
  nameEn?: string;
  city: string;
  address: string;
  starLevel: number;
  roomTypes: RoomType[];
  images: string[];
  openTime?: string;
  nearby?: string;
  discounts?: string;
  facilities?: string[];
  tags?: Tag[];
  reviewScore?: number;
  status: HotelStatus;
  rejectReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

