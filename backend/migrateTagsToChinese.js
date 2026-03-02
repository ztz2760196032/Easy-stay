const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Hotel = require('./src/models/Hotel');

dotenv.config({ path: path.join(__dirname, '.env') });

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

function normalizeTag(id, name) {
  const normalizedId = String(id || '').trim();
  const normalizedName = String(name || '').trim();
  const byId = TAG_CN_BY_ID[normalizedId.toLowerCase()];
  if (byId) return { id: normalizedId, name: byId };
  const byName = TAG_CN_BY_NAME[normalizedName];
  if (byName) return { id: normalizedId, name: byName };
  return { id: normalizedId, name: normalizedName };
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const docs = await Hotel.find({}, { tags: 1, images: 1 });

  let changed = 0;
  for (const doc of docs) {
    const nextTags = (doc.tags || [])
      .map((tag) => normalizeTag(tag?.id, tag?.name))
      .filter((tag) => tag.id);
    const nextImages = (doc.images || [])
      .map((url) => String(url || '').trim().replace(/[，,。；;]+$/g, ''))
      .filter(Boolean);

    const prevTags = (doc.tags || []).map((tag) => ({ id: String(tag?.id || ''), name: String(tag?.name || '') }));
    const prevImages = doc.images || [];
    const tagsChanged = JSON.stringify(prevTags) !== JSON.stringify(nextTags);
    const imagesChanged = JSON.stringify(prevImages) !== JSON.stringify(nextImages);

    if (tagsChanged || imagesChanged) {
      await Hotel.updateOne({ _id: doc._id }, { $set: { tags: nextTags, images: nextImages } });
      changed += 1;
    }
  }

  const total = await Hotel.countDocuments();
  console.log(`migrated hotels: ${changed}/${total}`);
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

