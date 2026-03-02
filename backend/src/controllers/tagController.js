const Hotel = require('../models/Hotel');

const TAG_CN_BY_ID = {
  luxury: '豪华',
  breakfast: '含早',
  business: '商务',
  metro: '地铁',
  family: '亲子',
  parking: '停车',
  seaview: '海景',
  downtown: '市中心',
  shopping: '商圈',
  food: '美食',
  nightview: '夜景',
  river: '江景',
  scenic: '景区',
  lake: '湖景',
};

const TAG_CN_BY_NAME = {
  Luxury: '豪华',
  Breakfast: '含早',
  Business: '商务',
  Metro: '地铁',
  Family: '亲子',
  Parking: '停车',
  Seaview: '海景',
  Downtown: '市中心',
  Shopping: '商圈',
  Food: '美食',
  Nightview: '夜景',
  River: '江景',
  Scenic: '景区',
  Lake: '湖景',
  Harbor: '海滨',
};

function normalizeTagName(id, name) {
  const byId = TAG_CN_BY_ID[String(id || '').toLowerCase()];
  if (byId) return byId;
  const byName = TAG_CN_BY_NAME[String(name || '').trim()];
  if (byName) return byName;
  return String(name || '').trim();
}

exports.getH5Tags = async (_req, res, next) => {
  try {
    const hotels = await Hotel.find({ status: 'published' }).select('tags').lean();
    const map = new Map();

    hotels.forEach((hotel) => {
      (hotel.tags || []).forEach((tag) => {
        if (!tag || !tag.id) return;
        const id = String(tag.id);
        const name = normalizeTagName(id, tag.name);
        if (!map.has(id)) map.set(id, { id, name });
      });
    });

    return res.json({
      code: 'OK',
      data: { list: Array.from(map.values()) },
    });
  } catch (error) {
    return next(error);
  }
};

