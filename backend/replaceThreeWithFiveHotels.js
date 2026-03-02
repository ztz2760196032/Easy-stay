const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Hotel = require('./src/models/Hotel');
const User = require('./src/models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

function room(id, name, price, discount = 1, stock = 8) {
  return { id, name, price, discount, bedCount: 1, facilities: ['免费WiFi'], stock };
}

function buildHotel(data, merchantId) {
  return {
    merchantId,
    nameZh: data.nameZh,
    nameEn: data.nameEn,
    city: data.city,
    address: data.address,
    starLevel: data.starLevel,
    roomTypes: data.roomTypes,
    images: data.images,
    openTime: data.openTime,
    nearby: data.nearby,
    discounts: data.discounts,
    facilities: data.facilities,
    tags: data.tags,
    reviewScore: data.reviewScore,
    status: 'published',
    rejectReason: '',
  };
}

async function ensureSeedMerchant() {
  let merchant = await User.findOne({ username: 'seed_merchant' });
  if (!merchant) {
    merchant = await User.create({
      username: 'seed_merchant',
      password: '123456',
      role: 'merchant',
    });
  }
  return merchant;
}

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('缺少 MONGODB_URI');

  await mongoose.connect(mongoUri);
  const merchant = await ensureSeedMerchant();

  const toDelete = ['易宿外滩酒店', '易宿国贸酒店', '易宿西湖酒店'];
  const delRes = await Hotel.deleteMany({ nameZh: { $in: toDelete } });

  const hotels = [
    {
      nameZh: '易宿陆家嘴酒店',
      nameEn: 'EasyStay Lujiazui Hotel',
      city: '上海',
      address: '上海市浦东新区世纪大道188号',
      starLevel: 5,
      roomTypes: [room('luzj-r1', '江景大床房', 988, 1), room('luzj-r2', '行政套房', 1388, 0.95, 5)],
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
      ],
      openTime: '2021-05-01',
      nearby: '陆家嘴、东方明珠',
      discounts: '连住两晚9折',
      facilities: ['健身房', '泳池', '停车场'],
      tags: [{ id: 'luxury', name: '豪华' }, { id: 'river', name: '江景' }],
      reviewScore: 4.8,
    },
    {
      nameZh: '易宿望京酒店',
      nameEn: 'EasyStay Wangjing Hotel',
      city: '北京',
      address: '北京市朝阳区望京阜通东大街66号',
      starLevel: 4,
      roomTypes: [room('wj-r1', '商务大床房', 688, 1), room('wj-r2', '高级双床房', 768, 0.92)],
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
      ],
      openTime: '2020-10-15',
      nearby: '望京SOHO、798艺术区',
      discounts: '周末立减80元',
      facilities: ['会议室', '洗衣房', '健身房'],
      tags: [{ id: 'business', name: '商务' }, { id: 'metro', name: '地铁' }],
      reviewScore: 4.6,
    },
    {
      nameZh: '易宿钱江新城酒店',
      nameEn: 'EasyStay Qianjiang New Town',
      city: '杭州',
      address: '杭州市上城区钱江路88号',
      starLevel: 5,
      roomTypes: [room('qj-r1', '城景大床房', 799, 1), room('qj-r2', '江景套房', 1199, 0.9, 4)],
      images: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791',
      ],
      openTime: '2019-09-20',
      nearby: '钱江新城、来福士',
      discounts: '提前7天预订95折',
      facilities: ['泳池', '行政酒廊', '停车场'],
      tags: [{ id: 'downtown', name: '市中心' }, { id: 'shopping', name: '商圈' }],
      reviewScore: 4.7,
    },
    {
      nameZh: '易宿橘子洲酒店',
      nameEn: 'EasyStay Juzizhou Hotel',
      city: '长沙',
      address: '长沙市岳麓区潇湘中路220号',
      starLevel: 4,
      roomTypes: [room('jzz-r1', '雅致双床房', 559, 1), room('jzz-r2', '江景大床房', 659, 0.9)],
      images: [
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c',
        'https://images.unsplash.com/photo-1501117716987-c8e2a8e4a237',
      ],
      openTime: '2022-03-18',
      nearby: '橘子洲、岳麓山',
      discounts: '工作日满减100元',
      facilities: ['自助早餐', '洗衣房', '停车场'],
      tags: [{ id: 'scenic', name: '景区' }, { id: 'family', name: '亲子' }],
      reviewScore: 4.5,
    },
    {
      nameZh: '易宿东湖绿道酒店',
      nameEn: 'EasyStay East Lake Greenway',
      city: '武汉',
      address: '武汉市武昌区东湖路66号',
      starLevel: 4,
      roomTypes: [room('dh-r1', '湖景双床房', 599, 1), room('dh-r2', '亲子家庭房', 799, 0.88, 6)],
      images: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      ],
      openTime: '2021-11-08',
      nearby: '东湖绿道、楚河汉街',
      discounts: '家庭房含双早',
      facilities: ['亲子乐园', '健身房', '停车场'],
      tags: [{ id: 'lake', name: '湖景' }, { id: 'family', name: '亲子' }],
      reviewScore: 4.6,
    },
  ];

  const insertDocs = hotels.map((h) => buildHotel(h, merchant._id));
  const insRes = await Hotel.insertMany(insertDocs);

  const total = await Hotel.countDocuments();
  const published = await Hotel.countDocuments({ status: 'published' });
  console.log(
    JSON.stringify(
      {
        deleted: delRes.deletedCount,
        inserted: insRes.length,
        insertedNames: insRes.map((h) => h.nameZh),
        total,
        published,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

