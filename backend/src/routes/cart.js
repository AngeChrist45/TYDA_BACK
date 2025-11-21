const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user cart
router.get('/', auth, asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product');

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.json({ success: true, data: cart });
}));

// Add item to cart
router.post('/items', auth, asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Produit non trouvé' });
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find(item => item.product.toString() === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cart.save();
  await cart.populate('items.product');

  res.json({ success: true, data: cart });
}));

// Update cart item quantity
router.put('/items/:itemId', auth, asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ success: false, message: 'Panier non trouvé' });
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Article non trouvé' });
  }

  item.quantity = quantity;
  await cart.save();
  await cart.populate('items.product');

  res.json({ success: true, data: cart });
}));

// Remove item from cart
router.delete('/items/:itemId', auth, asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ success: false, message: 'Panier non trouvé' });
  }

  cart.items.pull(req.params.itemId);
  await cart.save();
  await cart.populate('items.product');

  res.json({ success: true, data: cart });
}));

// Clear cart
router.delete('/', auth, asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  res.json({ success: true, data: cart });
}));

module.exports = router;
