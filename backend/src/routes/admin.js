// src/routes/admin.js
const express = require('express');
const {
	listHotels,
	getHotel,
	createHotel,
	updateHotel,
	deleteHotel,
	auditHotel,
	publishHotel,
	offlineHotel,
} = require('../controllers/adminController');
const {
	listUsers,
	getUser,
	createUser,
	updateUser,
	deleteUser,
} = require('../controllers/userController');
const {
	listBanners,
	getBanner,
	createBanner,
	updateBanner,
	deleteBanner,
} = require('../controllers/bannerController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 管理员酒店列表
router.get('/hotels', verifyToken, requireAdmin, listHotels);

// 管理员酒店 CRUD
router.get('/hotels/:id', verifyToken, requireAdmin, getHotel);
router.post('/hotels', verifyToken, requireAdmin, createHotel);
router.post('/hotels/:id/update', verifyToken, requireAdmin, updateHotel);
router.post('/hotels/:id/delete', verifyToken, requireAdmin, deleteHotel);

// 审核酒店（使用 POST）
router.post('/hotels/:id/audit', verifyToken, requireAdmin, auditHotel);

// 上线酒店（使用 POST）
router.post('/hotels/:id/publish', verifyToken, requireAdmin, publishHotel);

// 下线酒店（使用 POST）
router.post('/hotels/:id/offline', verifyToken, requireAdmin, offlineHotel);

// 管理员用户 CRUD
router.get('/users', verifyToken, requireAdmin, listUsers);
router.get('/users/:id', verifyToken, requireAdmin, getUser);
router.post('/users', verifyToken, requireAdmin, createUser);
router.post('/users/:id/update', verifyToken, requireAdmin, updateUser);
router.post('/users/:id/delete', verifyToken, requireAdmin, deleteUser);

// 管理员 Banner CRUD
router.get('/banners', verifyToken, requireAdmin, listBanners);
router.get('/banners/:id', verifyToken, requireAdmin, getBanner);
router.post('/banners', verifyToken, requireAdmin, createBanner);
router.post('/banners/:id/update', verifyToken, requireAdmin, updateBanner);
router.post('/banners/:id/delete', verifyToken, requireAdmin, deleteBanner);

module.exports = router;
