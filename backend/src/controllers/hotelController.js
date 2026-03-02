const Hotel = require('../models/Hotel');

// 获取面向H5端的酒店列表（仅公开已发布的）
exports.getH5Hotels = async (req, res) => {
  try {
    const { city, keyword, starRatings, minPrice, maxPrice, page = 1, pageSize = 10 } = req.query;
    
    // 构建基础查询条件
    let query = { status: 'published' };
    
    if (city) query.city = city;
    if (keyword) {
      query.$or = [
        { nameZh: new RegExp(keyword, 'i') },
        { address: new RegExp(keyword, 'i') }
      ];
    }
    if (starRatings) {
      const stars = starRatings.split(',').map(Number);
      query.starLevel = { $in: stars };
    }

    // 执行分页查询
    const total = await Hotel.countDocuments(query);
    const hotels = await Hotel.find(query)
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize));

    // 转换为H5需要的格式（对应原 api/server.js 的 toH5Hotel）
    const list = hotels.map(hotel => {
      const sortedRooms = [...hotel.roomTypes].sort((a, b) => a.price - b.price);
      return {
        id: hotel._id,
        name: hotel.nameZh || 'Unnamed Hotel',
        city: hotel.city,
        address: hotel.address,
        starRating: hotel.starLevel,
        reviewScore: hotel.reviewScore,
        images: hotel.images.length ? hotel.images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945'],
        minPrice: {
          amount: sortedRooms[0]?.price || 0,
          currency: 'CNY',
          unit: 'night'
        },
        tags: hotel.tags,
        auditStatus: 'APPROVED'
      };
    });

    res.json({
      code: 'OK',
      data: {
        list,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        hasMore: (page * pageSize) < total
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 获取酒店详情
exports.getHotelDetail = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.id, status: 'published' });
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    res.json({ code: 'OK', data: { hotel } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};