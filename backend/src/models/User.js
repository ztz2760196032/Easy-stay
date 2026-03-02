// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 用户角色枚举
const roleEnum = ['merchant', 'admin'];

// 用户 Schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // 默认查询不返回密码字段
    },
    role: {
      type: String,
      enum: {
        values: roleEnum,
        message: 'Role must be either "merchant" or "admin"',
      },
      default: 'merchant',
    },
  },
  {
    timestamps: true, // 自动维护 createdAt / updatedAt
  }
);

// 保存前对密码进行哈希
userSchema.pre('save', async function () {
  // 如果密码未被修改，直接返回（async hook 通过返回控制流）
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// 实例方法：校验密码
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
