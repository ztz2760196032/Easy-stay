// src/routes/home.js
const express = require('express');
const { getHomeData } = require('../controllers/homeController');

const router = express.Router();

// 首页/搜索页 Banner + 推荐酒店
router.get('/', getHomeData);

module.exports = router;
