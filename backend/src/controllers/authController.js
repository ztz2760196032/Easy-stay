// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, username: user.username },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );
};

// 注册
const register = async (req, res, next) => {
  try {
    const body = req.body || {};
    const { username, password, role } = body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const user = await User.create({
      username,
      password,
      role: role || 'merchant',
    });

    const token = signToken(user);

    return res.status(201).json({
      message: 'Register success',
      token,
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
};

// 登录
const login = async (req, res, next) => {
  try {
    const body = req.body || {};
    const { username, password } = body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = signToken(user);

    return res.json({
      message: 'Login success',
      token,
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
};

// 当前用户
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
