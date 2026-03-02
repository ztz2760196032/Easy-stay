const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '.env') });

const Hotel = require('./src/models/Hotel');
const User = require('./src/models/User');

function room(id, name, price, discount = 1, stock = 10) {
  return { id, name, price, discount, bedCount: 1, facilities: ['免费WiFi'], stock };
}

function hotelTemplate(opts) {
  const {
    nameZh,
    nameEn,
    city,
    address,
    starLevel,
    images,
    nearby,
    tags,
    facilities,
    reviewScore,
  } = opts;

  const roomTypes = [
    room(`${nameZh}-r1`, '高级大床房', 499, 1, 8),
    room(`${nameZh}-r2`, '豪华双床房', 699, 0.9, 6),
  ];

  return {
    nameZh,
    nameEn,
    city,
    address,
    starLevel,
    roomTypes,
    images,
    nearby,
    discounts: '周末特惠',
    tags,
    facilities,
    reviewScore,
    status: 'published',
    rejectReason: '',
  };
}

async function ensureSeedUsers() {
  const upsert = async (username, role) => {
    let user = await User.findOne({ username });
    if (!user) {
      user = await User.create({ username, password: '123456', role });
    }
    return user;
  };

  const merchant = await upsert('seed_merchant', 'merchant');
  const admin = await upsert('seed_admin', 'admin');
  return { merchant, admin };
}

async function migrateExistingToChinese() {
  // Keep it minimal: normalize city to Chinese for common seeds; update addresses for known seed names.
  await Hotel.updateMany({ city: 'Shanghai' }, { $set: { city: '上海' } });
  await Hotel.updateMany({ city: 'Beijing' }, { $set: { city: '北京' } });
  await Hotel.updateMany({ city: 'Hangzhou' }, { $set: { city: '杭州' } });

  await Hotel.updateOne(
    { nameZh: '易宿外滩酒店' },
    {
      $set: {
        city: '上海',
        address: '上海市黄浦区中山东一路88号',
        nearby: '外滩、豫园',
        tags: [{ id: 'luxury', name: '豪华' }, { id: 'breakfast', name: '含早' }],
      },
    }
  );
  await Hotel.updateOne(
    { nameZh: '易宿国贸酒店' },
    {
      $set: {
        city: '北京',
        address: '北京市朝阳区建国路18号',
        nearby: '国贸、CBD',
        tags: [{ id: 'business', name: '商务' }, { id: 'metro', name: '地铁' }],
      },
    }
  );
  await Hotel.updateOne(
    { nameZh: '易宿西湖酒店' },
    {
      $set: {
        city: '杭州',
        address: '杭州市西湖区曙光路66号',
        nearby: '西湖、黄龙商圈',
        tags: [{ id: 'family', name: '亲子' }, { id: 'parking', name: '停车' }],
      },
    }
  );

  // Fix common URL paste issues: trailing Chinese/English punctuation.
  const cursor = Hotel.find({}, { images: 1 }).cursor();
  for await (const doc of cursor) {
    const images = Array.isArray(doc.images) ? doc.images : [];
    const cleaned = images
      .filter((s) => typeof s === 'string')
      .map((s) => s.trim().replace(/[，,。；;]+$/g, ''))
      .filter(Boolean);
    const same =
      cleaned.length === images.length &&
      cleaned.every((v, idx) => v === images[idx]);
    if (!same) {
      await Hotel.updateOne({ _id: doc._id }, { $set: { images: cleaned } });
    }
  }
}

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('Missing MONGODB_URI in backend/.env');

  await mongoose.connect(mongoUri);

  const { merchant } = await ensureSeedUsers();
  await migrateExistingToChinese();

  const candidates = [
    hotelTemplate({
      nameZh: '易宿外滩酒店',
      nameEn: 'EasyStay Bund Hotel',
      city: '上海',
      address: '上海市黄浦区中山东一路88号',
      starLevel: 5,
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      ],
      nearby: '外滩、豫园',
      tags: [{ id: 'luxury', name: '豪华' }, { id: 'breakfast', name: '含早' }],
      facilities: ['健身房', '泳池', '停车场'],
      reviewScore: 4.8,
    }),
    hotelTemplate({
      nameZh: '易宿国贸酒店',
      nameEn: 'EasyStay CBD Hotel',
      city: '北京',
      address: '北京市朝阳区建国路18号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
      ],
      nearby: '国贸、CBD',
      tags: [{ id: 'business', name: '商务' }, { id: 'metro', name: '地铁' }],
      facilities: ['洗衣房', '健身房', '会议室'],
      reviewScore: 4.6,
    }),
    hotelTemplate({
      nameZh: '易宿深圳湾酒店',
      nameEn: 'EasyStay Shenzhen Bay',
      city: '深圳',
      address: '深圳市南山区后海大道9号',
      starLevel: 5,
      images: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
        'https://images.unsplash.com/photo-1501117716987-c8e2a8e4a237',
      ],
      nearby: '深圳湾公园、后海',
      tags: [{ id: 'seaview', name: '海景' }, { id: 'luxury', name: '豪华' }],
      facilities: ['泳池', '行政酒廊', '健身房'],
      reviewScore: 4.7,
    }),
    hotelTemplate({
      nameZh: '易宿珠江新城酒店',
      nameEn: 'EasyStay Zhujiang New Town',
      city: '广州',
      address: '广州市天河区珠江新城华夏路66号',
      starLevel: 5,
      images: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791',
      ],
      nearby: '珠江新城、广州塔',
      tags: [{ id: 'downtown', name: '市中心' }, { id: 'shopping', name: '商圈' }],
      facilities: ['泳池', '健身房', '停车场'],
      reviewScore: 4.7,
    }),
    hotelTemplate({
      nameZh: '易宿春熙路酒店',
      nameEn: 'EasyStay Chunxi Road',
      city: '成都',
      address: '成都市锦江区春熙路8号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      ],
      nearby: '春熙路、太古里',
      tags: [{ id: 'food', name: '美食' }, { id: 'shopping', name: '商圈' }],
      facilities: ['洗衣房', '健身房'],
      reviewScore: 4.6,
    }),
    hotelTemplate({
      nameZh: '易宿解放碑酒店',
      nameEn: 'EasyStay Jiefangbei',
      city: '重庆',
      address: '重庆市渝中区解放碑步行街1号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1501117716987-c8e2a8e4a237',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
      ],
      nearby: '解放碑、洪崖洞',
      tags: [{ id: 'nightview', name: '夜景' }, { id: 'downtown', name: '市中心' }],
      facilities: ['观景露台', '洗衣房'],
      reviewScore: 4.6,
    }),
    hotelTemplate({
      nameZh: '易宿江汉路酒店',
      nameEn: 'EasyStay Jianghan Road',
      city: '武汉',
      address: '武汉市江汉区江汉路99号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      ],
      nearby: '江汉路、汉口江滩',
      tags: [{ id: 'river', name: '江景' }, { id: 'metro', name: '地铁' }],
      facilities: ['健身房', '自助早餐'],
      reviewScore: 4.5,
    }),
    hotelTemplate({
      nameZh: '易宿新街口酒店',
      nameEn: 'EasyStay Xinjiekou',
      city: '南京',
      address: '南京市秦淮区新街口中山南路2号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427',
      ],
      nearby: '新街口、夫子庙',
      tags: [{ id: 'downtown', name: '市中心' }, { id: 'shopping', name: '商圈' }],
      facilities: ['洗衣房', '健身房'],
      reviewScore: 4.5,
    }),
    hotelTemplate({
      nameZh: '易宿大雁塔酒店',
      nameEn: 'EasyStay Dayanta',
      city: '西安',
      address: '西安市雁塔区大雁塔南广场6号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      ],
      nearby: '大雁塔、大唐不夜城',
      tags: [{ id: 'scenic', name: '景区' }, { id: 'family', name: '亲子' }],
      facilities: ['自助早餐', '停车场'],
      reviewScore: 4.6,
    }),
    hotelTemplate({
      nameZh: '易宿金鸡湖酒店',
      nameEn: 'EasyStay Jinji Lake',
      city: '苏州',
      address: '苏州市工业园区金鸡湖大道88号',
      starLevel: 5,
      images: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
      ],
      nearby: '金鸡湖、诚品书店',
      tags: [{ id: 'lake', name: '湖景' }, { id: 'luxury', name: '豪华' }],
      facilities: ['泳池', '健身房', '停车场'],
      reviewScore: 4.7,
    }),
    hotelTemplate({
      nameZh: '易宿海河酒店',
      nameEn: 'EasyStay Haihe',
      city: '天津',
      address: '天津市和平区海河沿线解放北路10号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
      ],
      nearby: '海河、意式风情区',
      tags: [{ id: 'river', name: '江景' }, { id: 'scenic', name: '景区' }],
      facilities: ['自助早餐', '洗衣房'],
      reviewScore: 4.5,
    }),
    hotelTemplate({
      nameZh: '易宿五一广场酒店',
      nameEn: 'EasyStay Wuyi Plaza',
      city: '长沙',
      address: '长沙市芙蓉区五一大道100号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427',
      ],
      nearby: '五一广场、坡子街',
      tags: [{ id: 'food', name: '美食' }, { id: 'downtown', name: '市中心' }],
      facilities: ['自助早餐', '洗衣房'],
      reviewScore: 4.5,
    }),
    hotelTemplate({
      nameZh: '易宿栈桥海景酒店',
      nameEn: 'EasyStay Qingdao Seaview',
      city: '青岛',
      address: '青岛市市南区栈桥路1号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1501117716987-c8e2a8e4a237',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791',
      ],
      nearby: '栈桥、八大关',
      tags: [{ id: 'seaview', name: '海景' }, { id: 'scenic', name: '景区' }],
      facilities: ['观景露台', '自助早餐'],
      reviewScore: 4.6,
    }),
    hotelTemplate({
      nameZh: '易宿东钱湖酒店',
      nameEn: 'EasyStay Dongqian Lake',
      city: '宁波',
      address: '宁波市鄞州区东钱湖旅游度假区8号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      ],
      nearby: '东钱湖、南塘老街',
      tags: [{ id: 'lake', name: '湖景' }, { id: 'family', name: '亲子' }],
      facilities: ['停车场', '自助早餐'],
      reviewScore: 4.5,
    }),
    hotelTemplate({
      nameZh: '易宿中山路酒店',
      nameEn: 'EasyStay Zhongshan Road',
      city: '厦门',
      address: '厦门市思明区中山路步行街66号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
      ],
      nearby: '中山路、鼓浪屿码头',
      tags: [{ id: 'seaview', name: '海滨' }, { id: 'scenic', name: '景区' }],
      facilities: ['自助早餐', '洗衣房'],
      reviewScore: 4.6,
    }),
    hotelTemplate({
      nameZh: '易宿郑东新区酒店',
      nameEn: 'EasyStay Zhengdong',
      city: '郑州',
      address: '郑州市郑东新区商务外环路18号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427',
      ],
      nearby: '郑东新区、会展中心',
      tags: [{ id: 'business', name: '商务' }, { id: 'metro', name: '地铁' }],
      facilities: ['健身房', '洗衣房'],
      reviewScore: 4.5,
    }),
    hotelTemplate({
      nameZh: '易宿翠湖酒店',
      nameEn: 'EasyStay Cuihu',
      city: '昆明',
      address: '昆明市五华区翠湖南路1号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      ],
      nearby: '翠湖公园、南屏街',
      tags: [{ id: 'scenic', name: '景区' }, { id: 'family', name: '亲子' }],
      facilities: ['自助早餐', '停车场'],
      reviewScore: 4.5,
    }),
    hotelTemplate({
      nameZh: '易宿星海广场酒店',
      nameEn: 'EasyStay Xinghai',
      city: '大连',
      address: '大连市沙河口区星海广场88号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1501117716987-c8e2a8e4a237',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
      ],
      nearby: '星海广场、滨海路',
      tags: [{ id: 'seaview', name: '海景' }, { id: 'downtown', name: '市中心' }],
      facilities: ['观景露台', '自助早餐'],
      reviewScore: 4.5,
    }),
    hotelTemplate({
      nameZh: '易宿泉城广场酒店',
      nameEn: 'EasyStay Quancheng',
      city: '济南',
      address: '济南市历下区泉城广场6号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427',
      ],
      nearby: '泉城广场、趵突泉',
      tags: [{ id: 'scenic', name: '景区' }, { id: 'metro', name: '地铁' }],
      facilities: ['洗衣房', '自助早餐'],
      reviewScore: 4.5,
    }),
    hotelTemplate({
      nameZh: '易宿三坊七巷酒店',
      nameEn: 'EasyStay Sanfang Qixiang',
      city: '福州',
      address: '福州市鼓楼区三坊七巷街区20号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      ],
      nearby: '三坊七巷、东街口',
      tags: [{ id: 'scenic', name: '景区' }, { id: 'food', name: '美食' }],
      facilities: ['自助早餐', '洗衣房'],
      reviewScore: 4.6,
    }),
    hotelTemplate({
      nameZh: '易宿中街酒店',
      nameEn: 'EasyStay Zhongjie',
      city: '沈阳',
      address: '沈阳市沈河区中街路88号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
      ],
      nearby: '中街、故宫',
      tags: [{ id: 'scenic', name: '景区' }, { id: 'downtown', name: '市中心' }],
      facilities: ['洗衣房', '自助早餐'],
      reviewScore: 4.5,
    }),
    hotelTemplate({
      nameZh: '易宿天鹅湖酒店',
      nameEn: 'EasyStay Swan Lake',
      city: '合肥',
      address: '合肥市蜀山区天鹅湖路18号',
      starLevel: 4,
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427',
      ],
      nearby: '天鹅湖、政务区',
      tags: [{ id: 'business', name: '商务' }, { id: 'family', name: '亲子' }],
      facilities: ['健身房', '洗衣房'],
      reviewScore: 4.5,
    }),
  ];

  const existingNames = new Set(
    (await Hotel.find({}, { nameZh: 1 }).lean()).map((h) => h.nameZh).filter(Boolean)
  );

  const toInsert = candidates
    .filter((h) => !existingNames.has(h.nameZh))
    .map((h) => ({ ...h, merchantId: merchant._id }));

  if (toInsert.length > 0) {
    await Hotel.insertMany(toInsert);
  }

  const total = await Hotel.countDocuments();
  const published = await Hotel.countDocuments({ status: 'published' });
  console.log(`Seed done. total=${total}, published=${published}, inserted=${toInsert.length}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
