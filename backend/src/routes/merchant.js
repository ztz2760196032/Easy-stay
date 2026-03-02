// src/routes/merchant.js
const express = require('express');
const { createHotel, getMyHotels, updateHotel, deleteHotel } = require('../controllers/merchantController');
const { verifyToken, requireMerchant } = require('../middleware/auth');

const router = express.Router();

// 商户创建酒店
router.post('/hotels', verifyToken, requireMerchant, createHotel);

// 商户查看自己的酒店
router.get('/hotels', verifyToken, requireMerchant, getMyHotels);

// 商户更新酒店（使用 POST）
router.post('/hotels/:id/update', verifyToken, requireMerchant, updateHotel);

// 商户删除酒店（使用 POST）
router.post('/hotels/:id/delete', verifyToken, requireMerchant, deleteHotel);

module.exports = router;
