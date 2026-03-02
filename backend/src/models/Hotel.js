const mongoose = require('mongoose');

const RoomTypeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  discount: { type: Number, default: 1 },
  bedCount: { type: Number, default: 1 },
  facilities: { type: [String], default: ['Free WiFi'] },
  stock: { type: Number, default: 5 }
});

const HotelSchema = new mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nameZh: { type: String, required: true },
  nameEn: { type: String },
  city: { type: String, required: true },
  address: { type: String, required: true },
  starLevel: { type: Number, min: 1, max: 5, default: 3 },
  roomTypes: [RoomTypeSchema],
  images: { type: [String], default: [] },
  openTime: { type: String },
  nearby: { type: String },
  discounts: { type: String },
  facilities: { type: [String], default: [] },
  tags: [{ id: String, name: String }],
  reviewScore: { type: Number, default: 4.5 },
  // 核心状态控制
  status: { 
    type: String, 
    enum: ['auditing', 'approved', 'rejected', 'published', 'offline'], 
    default: 'auditing' 
  },
  rejectReason: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Hotel', HotelSchema);
