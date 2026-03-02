import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'hotels.json');
const PORT = Number(process.env.PORT || 3001);

const DEFAULT_TAGS = [
  { id: 'luxury', name: 'Luxury' },
  { id: 'family', name: 'Family' },
  { id: 'parking', name: 'Parking' },
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'business', name: 'Business' }
];

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,x-user-role,x-user-id'
  });
  res.end(JSON.stringify(payload));
}

function ok(res, data) {
  sendJson(res, 200, {
    code: 'OK',
    message: 'success',
    data,
    requestId: Date.now().toString()
  });
}

function fail(res, statusCode, code, message) {
  sendJson(res, statusCode, {
    code,
    message,
    data: null,
    requestId: Date.now().toString()
  });
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
  } catch {
    return {};
  }
}

async function readState() {
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  const sanitized = raw.replace(/^\uFEFF/, '');
  return JSON.parse(sanitized);
}

async function writeState(state) {
  await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeRoomTypes(roomTypes = []) {
  return roomTypes.map((room, idx) => ({
    id: room.id || `${Date.now()}-${idx}`,
    name: room.name || `Room ${idx + 1}`,
    price: Math.max(0, toNumber(room.price, 0)),
    discount: room.discount ?? 1,
    bedCount: toNumber(room.bedCount, 1),
    facilities: Array.isArray(room.facilities) ? room.facilities : ['Free WiFi'],
    stock: toNumber(room.stock, 5)
  }));
}

function normalizeHotel(input = {}, fallback = {}) {
  const roomTypes = normalizeRoomTypes(input.roomTypes || fallback.roomTypes || []);
  return {
    id: input.id || fallback.id || Date.now().toString(),
    merchantId: input.merchantId || fallback.merchantId || '',
    nameZh: input.nameZh || fallback.nameZh || '',
    nameEn: input.nameEn || fallback.nameEn || '',
    city: input.city || fallback.city || '',
    address: input.address || fallback.address || '',
    starLevel: Math.min(5, Math.max(1, toNumber(input.starLevel, fallback.starLevel || 3))),
    roomTypes,
    openTime: input.openTime || fallback.openTime || new Date().toISOString().slice(0, 10),
    images: Array.isArray(input.images) && input.images.length > 0 ? input.images : (fallback.images || []),
    nearby: input.nearby || fallback.nearby || '',
    discounts: input.discounts || fallback.discounts || '',
    status: input.status || fallback.status || 'auditing',
    rejectReason: input.rejectReason || fallback.rejectReason || '',
    createdAt: fallback.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewScore: toNumber(input.reviewScore, toNumber(fallback.reviewScore, 4.5)),
    tags: Array.isArray(input.tags) ? input.tags : (fallback.tags || []),
    facilities: Array.isArray(input.facilities) ? input.facilities : (fallback.facilities || [])
  };
}

function patchStateMeta(state) {
  return {
    ...state,
    version: toNumber(state.version, 1) + 1,
    lastUpdated: new Date().toISOString()
  };
}

function ensurePublishedVisible(hotel) {
  return hotel.status === 'published';
}

function toH5Hotel(hotel) {
  const roomTypes = normalizeRoomTypes(hotel.roomTypes).map((room) => ({
    id: room.id,
    name: room.name,
    bedCount: room.bedCount,
    facilities: room.facilities,
    price: {
      amount: room.price,
      currency: 'CNY',
      unit: 'night'
    },
    stock: room.stock
  }));
  const sorted = [...roomTypes].sort((a, b) => a.price.amount - b.price.amount);
  const min = sorted[0]?.price.amount ?? 0;
  const imageList = hotel.images?.length ? hotel.images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945'];

  return {
    id: hotel.id,
    name: hotel.nameZh || hotel.nameEn || 'Unnamed Hotel',
    city: hotel.city,
    address: hotel.address,
    starRating: hotel.starLevel,
    reviewScore: toNumber(hotel.reviewScore, 4.5),
    tags: Array.isArray(hotel.tags) && hotel.tags.length > 0 ? hotel.tags : [],
    facilities: Array.isArray(hotel.facilities) ? hotel.facilities : [],
    images: imageList,
    roomTypes: sorted,
    minPrice: {
      amount: min,
      currency: 'CNY',
      unit: 'night'
    },
    auditStatus: hotel.status === 'approved' || hotel.status === 'published' ? 'APPROVED' : 'PENDING'
  };
}

function parseCsv(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function matchFilters(hotel, query) {
  if (query.city && hotel.city !== query.city) return false;

  const keyword = (query.keyword || '').trim().toLowerCase();
  if (keyword) {
    const haystack = `${hotel.name} ${hotel.city} ${hotel.address}`.toLowerCase();
    if (!haystack.includes(keyword)) return false;
  }

  const starRatings = parseCsv(query.starRatings).map((n) => Number(n)).filter(Number.isFinite);
  if (starRatings.length > 0 && !starRatings.includes(hotel.starRating)) return false;

  const minPrice = query.minPrice === undefined ? undefined : Number(query.minPrice);
  const maxPrice = query.maxPrice === undefined ? undefined : Number(query.maxPrice);
  if (Number.isFinite(minPrice) && hotel.minPrice.amount < minPrice) return false;
  if (Number.isFinite(maxPrice) && hotel.minPrice.amount > maxPrice) return false;

  const tagIds = parseCsv(query.tagIds);
  if (tagIds.length > 0) {
    const hotelTagIds = hotel.tags.map((tag) => tag.id);
    const allMatch = tagIds.every((id) => hotelTagIds.includes(id));
    if (!allMatch) return false;
  }

  return true;
}

function requireRole(req, role) {
  const current = req.headers['x-user-role'];
  return current === role;
}

function getUserId(req) {
  const userId = req.headers['x-user-id'];
  return typeof userId === 'string' ? userId : '';
}

const server = http.createServer(async (req, res) => {
  if (!req.url) return fail(res, 400, 'BAD_REQUEST', 'missing url');

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    if (req.method === 'GET' && pathname === '/api/health') {
      return ok(res, { status: 'ok' });
    }

    if (req.method === 'GET' && pathname === '/api/tags') {
      const state = await readState();
      const dynamicTags = state.hotels.flatMap((h) => (Array.isArray(h.tags) ? h.tags : []));
      const tagsMap = new Map([...DEFAULT_TAGS, ...dynamicTags].map((tag) => [tag.id, tag]));
      return ok(res, [...tagsMap.values()]);
    }

    if (req.method === 'GET' && pathname === '/api/merchant/hotels') {
      if (!requireRole(req, 'merchant')) return fail(res, 403, 'UNAUTHORIZED', 'merchant role required');
      const merchantId = getUserId(req);
      if (!merchantId) return fail(res, 400, 'VALIDATION_ERROR', 'missing merchant user id');
      const state = await readState();
      const list = state.hotels.filter((hotel) => hotel.merchantId === merchantId);
      return ok(res, { list, version: state.version, lastUpdated: state.lastUpdated });
    }

    if (req.method === 'POST' && pathname === '/api/merchant/hotels') {
      if (!requireRole(req, 'merchant')) return fail(res, 403, 'UNAUTHORIZED', 'merchant role required');
      const merchantId = getUserId(req);
      if (!merchantId) return fail(res, 400, 'VALIDATION_ERROR', 'missing merchant user id');
      const payload = await readBody(req);
      if (!payload.nameZh || !payload.address || !payload.city || !Array.isArray(payload.roomTypes) || payload.roomTypes.length === 0) {
        return fail(res, 400, 'VALIDATION_ERROR', 'nameZh/address/city/roomTypes are required');
      }

      let state = await readState();
      const hotel = normalizeHotel({ ...payload, merchantId, status: 'auditing', rejectReason: '' });
      state.hotels = [hotel, ...state.hotels];
      state = patchStateMeta(state);
      await writeState(state);
      return ok(res, { hotel, version: state.version, lastUpdated: state.lastUpdated });
    }

    if (req.method === 'PUT' && pathname.startsWith('/api/merchant/hotels/')) {
      if (!requireRole(req, 'merchant')) return fail(res, 403, 'UNAUTHORIZED', 'merchant role required');
      const merchantId = getUserId(req);
      if (!merchantId) return fail(res, 400, 'VALIDATION_ERROR', 'missing merchant user id');
      const id = pathname.split('/').pop();
      const payload = await readBody(req);
      let state = await readState();
      const idx = state.hotels.findIndex((hotel) => hotel.id === id);
      if (idx < 0) return fail(res, 404, 'HOTEL_NOT_FOUND', 'hotel not found');

      const current = state.hotels[idx];
      if (current.merchantId !== merchantId) {
        return fail(res, 403, 'UNAUTHORIZED', 'cannot edit others hotel');
      }
      if (!payload.nameZh || !payload.address || !payload.city || !Array.isArray(payload.roomTypes) || payload.roomTypes.length === 0) {
        return fail(res, 400, 'VALIDATION_ERROR', 'nameZh/address/city/roomTypes are required');
      }

      const updated = normalizeHotel({ ...current, ...payload, merchantId, status: 'auditing', rejectReason: '' }, current);
      state.hotels[idx] = updated;
      state = patchStateMeta(state);
      await writeState(state);
      return ok(res, { hotel: updated, version: state.version, lastUpdated: state.lastUpdated });
    }

    if (req.method === 'GET' && pathname === '/api/admin/hotels') {
      if (!requireRole(req, 'admin')) return fail(res, 403, 'UNAUTHORIZED', 'admin role required');
      const state = await readState();
      const status = url.searchParams.get('status');
      const list = status ? state.hotels.filter((hotel) => hotel.status === status) : state.hotels;
      return ok(res, { list, version: state.version, lastUpdated: state.lastUpdated });
    }

    if (req.method === 'PATCH' && pathname.match(/^\/api\/admin\/hotels\/[^/]+\/review$/)) {
      if (!requireRole(req, 'admin')) return fail(res, 403, 'UNAUTHORIZED', 'admin role required');
      const id = pathname.split('/')[4];
      const payload = await readBody(req);
      const approved = Boolean(payload.approved);
      const reason = String(payload.reason || '').trim();

      let state = await readState();
      const idx = state.hotels.findIndex((hotel) => hotel.id === id);
      if (idx < 0) return fail(res, 404, 'HOTEL_NOT_FOUND', 'hotel not found');

      const current = state.hotels[idx];
      if (current.status !== 'auditing') {
        return fail(res, 409, 'INVALID_STATUS_TRANSITION', 'only auditing hotel can be reviewed');
      }
      if (!approved && !reason) {
        return fail(res, 400, 'VALIDATION_ERROR', 'reject reason is required');
      }

      state.hotels[idx] = {
        ...current,
        status: approved ? 'approved' : 'rejected',
        rejectReason: approved ? '' : reason,
        updatedAt: new Date().toISOString()
      };
      state = patchStateMeta(state);
      await writeState(state);
      return ok(res, { hotel: state.hotels[idx], version: state.version, lastUpdated: state.lastUpdated });
    }

    if (req.method === 'PATCH' && pathname.match(/^\/api\/admin\/hotels\/[^/]+\/publish$/)) {
      if (!requireRole(req, 'admin')) return fail(res, 403, 'UNAUTHORIZED', 'admin role required');
      const id = pathname.split('/')[4];
      let state = await readState();
      const idx = state.hotels.findIndex((hotel) => hotel.id === id);
      if (idx < 0) return fail(res, 404, 'HOTEL_NOT_FOUND', 'hotel not found');
      if (state.hotels[idx].status !== 'approved') {
        return fail(res, 409, 'INVALID_STATUS_TRANSITION', 'only approved hotel can be published');
      }
      state.hotels[idx] = { ...state.hotels[idx], status: 'published', updatedAt: new Date().toISOString() };
      state = patchStateMeta(state);
      await writeState(state);
      return ok(res, { hotel: state.hotels[idx], version: state.version, lastUpdated: state.lastUpdated });
    }

    if (req.method === 'PATCH' && pathname.match(/^\/api\/admin\/hotels\/[^/]+\/offline$/)) {
      if (!requireRole(req, 'admin')) return fail(res, 403, 'UNAUTHORIZED', 'admin role required');
      const id = pathname.split('/')[4];
      let state = await readState();
      const idx = state.hotels.findIndex((hotel) => hotel.id === id);
      if (idx < 0) return fail(res, 404, 'HOTEL_NOT_FOUND', 'hotel not found');
      if (state.hotels[idx].status !== 'published') {
        return fail(res, 409, 'INVALID_STATUS_TRANSITION', 'only published hotel can be offlined');
      }
      state.hotels[idx] = { ...state.hotels[idx], status: 'offline', updatedAt: new Date().toISOString() };
      state = patchStateMeta(state);
      await writeState(state);
      return ok(res, { hotel: state.hotels[idx], version: state.version, lastUpdated: state.lastUpdated });
    }

    if (req.method === 'PATCH' && pathname.match(/^\/api\/admin\/hotels\/[^/]+\/restore$/)) {
      if (!requireRole(req, 'admin')) return fail(res, 403, 'UNAUTHORIZED', 'admin role required');
      const id = pathname.split('/')[4];
      let state = await readState();
      const idx = state.hotels.findIndex((hotel) => hotel.id === id);
      if (idx < 0) return fail(res, 404, 'HOTEL_NOT_FOUND', 'hotel not found');
      if (state.hotels[idx].status !== 'offline') {
        return fail(res, 409, 'INVALID_STATUS_TRANSITION', 'only offline hotel can be restored');
      }
      state.hotels[idx] = { ...state.hotels[idx], status: 'approved', updatedAt: new Date().toISOString() };
      state = patchStateMeta(state);
      await writeState(state);
      return ok(res, { hotel: state.hotels[idx], version: state.version, lastUpdated: state.lastUpdated });
    }

    if (req.method === 'GET' && pathname === '/api/h5/hotels') {
      const state = await readState();
      const source = state.hotels.filter(ensurePublishedVisible).map(toH5Hotel);
      const filtered = source.filter((hotel) => matchFilters(hotel, Object.fromEntries(url.searchParams.entries())));

      const page = Math.max(1, Number(url.searchParams.get('page') || 1));
      const pageSize = Math.max(1, Number(url.searchParams.get('pageSize') || 10));
      const start = (page - 1) * pageSize;
      const list = filtered.slice(start, start + pageSize);

      return ok(res, {
        list,
        page,
        pageSize,
        total: filtered.length,
        hasMore: start + pageSize < filtered.length,
        version: state.version,
        lastUpdated: new Date(state.lastUpdated).getTime()
      });
    }

    if (req.method === 'GET' && pathname.startsWith('/api/h5/hotels/')) {
      const id = pathname.split('/').pop();
      const state = await readState();
      const hotel = state.hotels.find((item) => item.id === id);
      if (!hotel) return fail(res, 404, 'HOTEL_NOT_FOUND', 'hotel not found');
      if (!ensurePublishedVisible(hotel)) return fail(res, 404, 'HOTEL_NOT_VISIBLE', 'hotel is not visible');
      return ok(res, {
        hotel: toH5Hotel(hotel),
        version: state.version,
        lastUpdated: new Date(state.lastUpdated).getTime()
      });
    }

    if (req.method === 'POST' && pathname === '/api/h5/prices/refresh') {
      const state = await readState();
      return ok(res, {
        changed: false,
        version: state.version,
        lastUpdated: new Date(state.lastUpdated).getTime()
      });
    }

    return fail(res, 404, 'NOT_FOUND', 'route not found');
  } catch (error) {
    return fail(res, 500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'internal error');
  }
});

server.listen(PORT, () => {
  console.log(`easy-stay-api running at http://localhost:${PORT}`);
});
