const mongoose = require('mongoose');
const fs = require('fs/promises');
const path = require('path');
const dotenv = require('dotenv');

const Hotel = require('./src/models/Hotel');

dotenv.config();

async function readSeedJson() {
  const candidateFiles = [
    // Old location mentioned in README (may not exist in this repo).
    path.join(__dirname, '../api/data/hotels.json'),
    // Current repo backup.
    path.join(__dirname, '../_api_backup/data/hotels.json'),
  ];

  let raw;
  let sourceFile = candidateFiles[0];
  try {
    raw = await fs.readFile(candidateFiles[0], 'utf-8');
  } catch {
    sourceFile = candidateFiles[1];
    raw = await fs.readFile(candidateFiles[1], 'utf-8');
  }

  return { sourceFile, data: JSON.parse(raw) };
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const { sourceFile, data } = await readSeedJson();
  const hotels = Array.isArray(data?.hotels) ? data.hotels : [];

  const existingCount = await Hotel.countDocuments();
  if (existingCount > 0 && !process.argv.includes('--reset')) {
    console.log(`Skip import: hotels collection is not empty (${existingCount}). Re-run with --reset to wipe & re-import.`);
    process.exit(0);
  }

  if (process.argv.includes('--reset')) {
    await Hotel.deleteMany({});
  }

  // HotelSchema requires an ObjectId merchantId. Seed files may contain arbitrary strings.
  const seedMerchantId = new mongoose.Types.ObjectId();

  const formatted = hotels.map((h) => ({
    ...h,
    _id: new mongoose.Types.ObjectId(),
    merchantId: mongoose.isValidObjectId(h.merchantId) ? h.merchantId : seedMerchantId,
    status: h.status || 'published',
  }));

  await Hotel.insertMany(formatted);
  console.log(`Data Imported from ${sourceFile}! (${formatted.length} hotels)`);
  process.exit();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

