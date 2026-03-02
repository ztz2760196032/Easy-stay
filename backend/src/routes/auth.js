// src/routes/auth.js
const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// 注册
router.post('/register', register);

// 登录
router.post('/login', login);

// 当前用户
router.get('/me', verifyToken, getMe);

module.exports = router;
