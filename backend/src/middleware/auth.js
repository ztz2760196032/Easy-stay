// src/middleware/auth.js
const jwt = require('jsonwebtoken');

// 校验并解析 JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing Authorization token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload; // { id, role, username }
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// 可选鉴权：用于公共接口但允许管理员/商户查看更多数据
const optionalAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload;
  } catch (error) {
    // 这里不阻断请求，仅忽略无效 token
  }

  return next();
};

// 角色校验：管理员
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin role required' });
  }
  return next();
};

// 角色校验：商户
const requireMerchant = (req, res, next) => {
  if (req.user?.role !== 'merchant') {
    return res.status(403).json({ message: 'Merchant role required' });
  }
  return next();
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireAdmin,
  requireMerchant,
};
