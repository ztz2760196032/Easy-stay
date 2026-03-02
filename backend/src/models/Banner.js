// src/models/Banner.js
const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String },
    imageUrl: { type: String, required: true },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
