// src/controllers/homeController.js
const Banner = require('../models/Banner');
const Hotel = require('../models/Hotel');

// 首页/搜索页需要的 Banner 与推荐酒店
const getHomeData = async (_req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate({
        path: 'hotel',
        match: { auditStatus: 'approved', isOnline: true },
      });

    const featuredHotels = await Hotel.find({
      isFeatured: true,
      auditStatus: 'approved',
      isOnline: true,
    }).sort({ updatedAt: -1 });

    return res.json({ banners, featuredHotels });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getHomeData,
};
