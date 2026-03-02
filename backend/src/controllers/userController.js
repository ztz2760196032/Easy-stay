// src/controllers/userController.js
const User = require('../models/User');

// 管理员：用户列表
const listUsers = async (req, res, next) => {
  try {
    const { role, keyword } = req.query;
    const query = {};

    if (role) query.role = role;
    if (keyword) {
      query.username = { $regex: keyword, $options: 'i' };
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
};

// 管理员：获取用户详情
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

// 管理员：创建用户
const createUser = async (req, res, next) => {
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

    return res.status(201).json({
      message: 'User created',
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
};

// 管理员：更新用户
const updateUser = async (req, res, next) => {
  try {
    const body = req.body || {};
    const { username, password, role } = body;
    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username && username.toLowerCase() !== user.username) {
      const existing = await User.findOne({ username: username.toLowerCase() });
      if (existing && String(existing._id) !== String(user._id)) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      user.username = username;
    }

    if (password) {
      user.password = password;
    }

    if (role) {
      user.role = role;
    }

    await user.save();

    return res.json({
      message: 'User updated',
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
};

// 管理员：删除用户
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ message: 'User deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
