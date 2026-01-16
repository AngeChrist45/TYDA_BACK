const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');


router.get('/', auth, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user._id;
  let cart = await Cart.findOne({ user: userId })
    .populate('items.product');

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  res.json({ success: true, data: cart });
}));

// Add item to cart
router.post('/items', auth, asyncHandler(async (req, res) => {
  const { productId, quantity = 1, negotiatedPrice } = req.body;

  console.log(' Cart add request:', {
    productId,
    quantity,
    negotiatedPrice,
    userId: req.user.userId || req.user._id,
    body: req.body
  });

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'productId est requis'
    });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Produit non trouvé' });
  }

  const userId = req.user.userId || req.user._id;
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  const existingItem = cart.items.find(item => item.product.toString() === productId);

  // Utiliser le prix négocié si fourni, sinon le prix normal
  const finalPrice = negotiatedPrice || product.price;

  if (existingItem) {
    existingItem.quantity += quantity;
    // Si un prix négocié est fourni, mettre à jour le prix
    if (negotiatedPrice) {
      existingItem.price = negotiatedPrice;
    }
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: finalPrice
    });
  }

  await cart.save();
  await cart.populate('items.product');

  res.json({ success: true, data: cart });
}));

// Update cart item quantity
router.put('/items/:itemId', auth, asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  const userId = req.user.userId || req.user._id;
  const cart = await Cart.findOne({ user: userId });
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
  const userId = req.user.userId || req.user._id;
  const cart = await Cart.findOne({ user: userId });
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
  const userId = req.user.userId || req.user._id;
  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  res.json({ success: true, data: cart });
}));

module.exports = router;
