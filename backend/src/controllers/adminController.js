const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');

const pick = (payload, allowlist) => {
  const body = payload || {};
  const out = {};
  allowlist.forEach((key) => {
    if (body[key] !== undefined) out[key] = body[key];
  });
  return out;
};

const HOTEL_EDITABLE_FIELDS = [
  'merchantId',
  'nameZh',
  'nameEn',
  'city',
  'address',
  'starLevel',
  'roomTypes',
  'images',
  'nearby',
  'facilities',
  'tags',
  'reviewScore',
  'openTime',
  'discounts',
  'status',
  'rejectReason',
];

// Admin: list hotels (supports optional status filter + pagination).
exports.listHotels = async (req, res) => {
  try {
    const { status, merchantId, page = 1, pageSize = 20 } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const sizeNum = Math.max(1, Math.min(200, Number(pageSize) || 20));

    const query = {};
    if (status) query.status = String(status);
    if (merchantId && mongoose.isValidObjectId(merchantId)) query.merchantId = merchantId;

    const total = await Hotel.countDocuments(query);
    const list = await Hotel.find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip((pageNum - 1) * sizeNum)
      .limit(sizeNum);

    return res.json({
      code: 'OK',
      data: { list, total, page: pageNum, pageSize: sizeNum },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Admin: get hotel detail
exports.getHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    return res.json({ code: 'OK', data: hotel });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Admin: create hotel (rarely used; mainly for debugging/seed).
exports.createHotel = async (req, res) => {
  try {
    const data = pick(req.body, HOTEL_EDITABLE_FIELDS);

    if (!data.merchantId || !mongoose.isValidObjectId(data.merchantId)) {
      return res.status(400).json({ message: 'merchantId (ObjectId) is required' });
    }
    if (!data.nameZh || !data.city || !data.address) {
      return res.status(400).json({ message: 'nameZh, city, address are required' });
    }

    const hotel = await Hotel.create({
      ...data,
      status: data.status || 'auditing',
      rejectReason: data.rejectReason || '',
    });

    return res.status(201).json({ code: 'OK', data: hotel });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Admin: update hotel fields.
exports.updateHotel = async (req, res) => {
  try {
    const data = pick(req.body, HOTEL_EDITABLE_FIELDS);
    if (data.merchantId && !mongoose.isValidObjectId(data.merchantId)) {
      return res.status(400).json({ message: 'merchantId must be a valid ObjectId' });
    }

    const hotel = await Hotel.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

    return res.json({ code: 'OK', data: hotel });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Admin: delete hotel
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    return res.json({ code: 'OK' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Admin: audit hotel (auditing -> approved/rejected)
exports.auditHotel = async (req, res) => {
  const { approved, reason } = req.body || {};
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    if (hotel.status !== 'auditing') {
      return res.status(409).json({ message: 'Invalid transition' });
    }

    hotel.status = approved ? 'approved' : 'rejected';
    hotel.rejectReason = approved ? '' : String(reason || '');
    await hotel.save();

    return res.json({ code: 'OK', data: hotel });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Admin: publish (approved -> published)
exports.publishHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOneAndUpdate(
      { _id: req.params.id, status: 'approved' },
      { status: 'published' },
      { new: true }
    );
    if (!hotel) return res.status(400).json({ message: 'Only approved hotel can be published' });
    return res.json({ code: 'OK', data: hotel });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Admin: offline (published -> offline)
exports.offlineHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOneAndUpdate(
      { _id: req.params.id, status: 'published' },
      { status: 'offline' },
      { new: true }
    );
    if (!hotel) return res.status(400).json({ message: 'Only published hotel can be offlined' });
    return res.json({ code: 'OK', data: hotel });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

