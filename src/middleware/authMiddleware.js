// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireLogin = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    console.error(err);
    res.redirect('/login');
  }
};

module.exports = { requireLogin };
