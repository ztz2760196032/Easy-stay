import { create } from 'zustand';
import { apiRequest } from '../lib/apiClient';
import type { Hotel, HotelStatus } from '../types/hotel';
import { useAuthStore } from './useAuth';

type BackendHotel = Omit<Hotel, 'id'> & { _id: string };

function mapHotel(h: BackendHotel): Hotel {
  return { ...h, id: h._id };
}

interface HotelStore {
  merchantHotels: Hotel[];
  adminHotels: Hotel[];
  loading: boolean;
  error: string;

  fetchMerchantHotels: () => Promise<void>;
  fetchAdminHotels: () => Promise<void>;

  createHotel: (hotel: Omit<Hotel, 'id' | 'merchantId' | 'status' | 'rejectReason' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMerchantHotel: (
    id: string,
    data: Partial<Omit<Hotel, 'id' | 'merchantId' | 'status' | 'rejectReason' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;

  auditHotel: (id: string, approved: boolean, reason?: string) => Promise<void>;
  publishHotel: (id: string) => Promise<void>;
  offlineHotel: (id: string) => Promise<void>;
  setStatusUnsafe: (id: string, status: HotelStatus) => Promise<void>;
}

export const useHotelStore = create<HotelStore>((set) => ({
  merchantHotels: [],
  adminHotels: [],
  loading: false,
  error: '',

  fetchMerchantHotels: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ loading: true, error: '' });
    try {
      const res = await apiRequest<{ code: string; data: { list: BackendHotel[] } }>('/api/merchant/hotels', { token });
      set({ merchantHotels: (res.data.list || []).map(mapHotel) });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '加载酒店失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchAdminHotels: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ loading: true, error: '' });
    try {
      const res = await apiRequest<{ code: string; data: { list: BackendHotel[] } }>('/api/admin/hotels', { token });
      set({ adminHotels: (res.data.list || []).map(mapHotel) });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '加载酒店失败' });
    } finally {
      set({ loading: false });
    }
  },

  createHotel: async (hotel) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('请先登录');
    await apiRequest('/api/merchant/hotels', { token, method: 'POST', body: hotel });
    await useHotelStore.getState().fetchMerchantHotels();
  },

  updateMerchantHotel: async (id, data) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('请先登录');
    await apiRequest(`/api/merchant/hotels/${id}/update`, { token, method: 'POST', body: data });
    await useHotelStore.getState().fetchMerchantHotels();
  },

  auditHotel: async (id, approved, reason) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('请先登录');
    await apiRequest(`/api/admin/hotels/${id}/audit`, { token, method: 'POST', body: { approved, reason } });
    await useHotelStore.getState().fetchAdminHotels();
  },

  publishHotel: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('请先登录');
    await apiRequest(`/api/admin/hotels/${id}/publish`, { token, method: 'POST' });
    await useHotelStore.getState().fetchAdminHotels();
  },

  offlineHotel: async (id) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('请先登录');
    await apiRequest(`/api/admin/hotels/${id}/offline`, { token, method: 'POST' });
    await useHotelStore.getState().fetchAdminHotels();
  },

  setStatusUnsafe: async (id, status) => {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error('请先登录');
    await apiRequest(`/api/admin/hotels/${id}/update`, { token, method: 'POST', body: { status } });
    await useHotelStore.getState().fetchAdminHotels();
  },
}));
