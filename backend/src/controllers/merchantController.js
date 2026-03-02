const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');

const EDITABLE_FIELDS = [
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
];

const pickPayload = (payload) => {
  const body = payload || {};
  const out = {};
  EDITABLE_FIELDS.forEach((key) => {
    if (body[key] !== undefined) out[key] = body[key];
  });
  return out;
};

// Merchant: create hotel (default auditing)
const createHotel = async (req, res, next) => {
  try {
    const merchantId = req.user?.id;
    if (!merchantId || !mongoose.isValidObjectId(merchantId)) {
      return res.status(401).json({ message: 'Invalid merchant identity' });
    }

    const data = pickPayload(req.body);
    if (!data.nameZh || !data.city || !data.address) {
      return res.status(400).json({ message: 'nameZh, city, address are required' });
    }

    const hotel = await Hotel.create({
      ...data,
      merchantId,
      status: 'auditing',
      rejectReason: '',
    });

    return res.status(201).json({ code: 'OK', data: hotel });
  } catch (error) {
    return next(error);
  }
};

// Merchant: list my hotels
const getMyHotels = async (req, res, next) => {
  try {
    const merchantId = req.user?.id;
    const hotels = await Hotel.find({ merchantId }).sort({ createdAt: -1 });
    return res.json({ code: 'OK', data: { list: hotels } });
  } catch (error) {
    return next(error);
  }
};

// Merchant: update my hotel (resets to auditing)
const updateHotel = async (req, res, next) => {
  try {
    const merchantId = req.user?.id;
    const hotel = await Hotel.findOne({ _id: req.params.id, merchantId });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

    const data = pickPayload(req.body);
    Object.assign(hotel, data);

    // Re-audit after changes.
    hotel.status = 'auditing';
    hotel.rejectReason = '';
    await hotel.save();

    return res.json({ code: 'OK', data: hotel });
  } catch (error) {
    return next(error);
  }
};

// Merchant: delete my hotel
const deleteHotel = async (req, res, next) => {
  try {
    const merchantId = req.user?.id;
    const hotel = await Hotel.findOneAndDelete({ _id: req.params.id, merchantId });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    return res.json({ code: 'OK' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createHotel,
  getMyHotels,
  updateHotel,
  deleteHotel,
};

