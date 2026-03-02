// src/controllers/bannerController.js
const Banner = require('../models/Banner');

// 管理员：Banner 列表
const listBanners = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const banners = await Banner.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate('hotel');

    return res.json({ banners });
  } catch (error) {
    return next(error);
  }
};

// 管理员：获取 Banner 详情
const getBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id).populate('hotel');
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    return res.json({ banner });
  } catch (error) {
    return next(error);
  }
};

// 管理员：创建 Banner
const createBanner = async (req, res, next) => {
  try {
    const body = req.body || {};
    const { title, imageUrl, hotel, isActive, sortOrder } = body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'imageUrl is required' });
    }

    const banner = await Banner.create({
      title,
      imageUrl,
      hotel,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder !== undefined ? sortOrder : 0,
    });

    return res.status(201).json({ message: 'Banner created', banner });
  } catch (error) {
    return next(error);
  }
};

// 管理员：更新 Banner
const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    const body = req.body || {};
    const { title, imageUrl, hotel, isActive, sortOrder } = body;
    if (title !== undefined) banner.title = title;
    if (imageUrl !== undefined) banner.imageUrl = imageUrl;
    if (hotel !== undefined) banner.hotel = hotel;
    if (isActive !== undefined) banner.isActive = isActive;
    if (sortOrder !== undefined) banner.sortOrder = sortOrder;

    await banner.save();

    return res.json({ message: 'Banner updated', banner });
  } catch (error) {
    return next(error);
  }
};

// 管理员：删除 Banner
const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    return res.json({ message: 'Banner deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
};
