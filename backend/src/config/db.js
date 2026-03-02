// src/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-booking';
    await mongoose.connect(mongoUri, {
      // Mongoose 7+ 不再需要这些选项，但保留以兼容旧版本或明确意图
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); // 连接失败则退出进程
  }
};

module.exports = connectDB;