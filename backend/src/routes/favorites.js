const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Get user favorites
router.get('/', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('favorites');
  res.json({ success: true, data: user.favorites || [] });
}));

// Add product to favorites
router.post('/', auth, asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const user = await User.findById(req.user._id);
  if (!user.favorites.includes(productId)) {
    user.favorites.push(productId);
    await user.save();
  }

  await user.populate('favorites');
  res.json({ success: true, data: user.favorites });
}));

// Remove product from favorites
router.delete('/:productId', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.favorites = user.favorites.filter(id => id.toString() !== req.params.productId);
  await user.save();

  await user.populate('favorites');
  res.json({ success: true, data: user.favorites });
}));

module.exports = router;
