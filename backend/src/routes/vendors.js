const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Negotiation = require('../models/Negotiation');

// Request to become vendor
router.post('/request', auth, asyncHandler(async (req, res) => {
  const { businessName, businessDescription, businessAddress } = req.body;

  const user = await User.findById(req.user._id);
  if (user.role === 'vendeur') {
    return res.status(400).json({ success: false, message: 'Vous êtes déjà vendeur' });
  }

  user.vendorInfo = {
    businessName,
    businessDescription,
    businessAddress,
    requestedAt: new Date()
  };
  user.accountStatus = 'pending_vendor';

  await user.save();
  res.json({ success: true, message: 'Demande envoyée avec succès' });
}));

// Get vendor dashboard
router.get('/dashboard', [auth, authorize('vendeur')], asyncHandler(async (req, res) => {
  const products = await Product.find({ vendor: req.user._id });
  const orders = await Order.find({ 'items.product': { $in: products.map(p => p._id) } });
  const negotiations = await Negotiation.find({ vendor: req.user._id, status: 'pending' });

  const revenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  res.json({
    success: true,
    data: {
      totalProducts: products.length,
      totalSales: orders.length,
      pendingNegotiations: negotiations.length,
      revenue
    }
  });
}));

// Get vendor products
router.get('/products', [auth, authorize('vendeur')], asyncHandler(async (req, res) => {
  const products = await Product.find({ vendor: req.user._id })
    .populate('category')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: products });
}));

// Create product
router.post('/products', [auth, authorize('vendeur')], asyncHandler(async (req, res) => {
  const productData = {
    ...req.body,
    vendor: req.user._id
  };

  const product = await Product.create(productData);
  await product.populate(['category', 'vendor']);

  res.json({ success: true, data: product });
}));

// Update product
router.put('/products/:id', [auth, authorize('vendeur')], asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, vendor: req.user._id });
  
  if (!product) {
    return res.status(404).json({ success: false, message: 'Produit non trouvé' });
  }

  Object.assign(product, req.body);
  await product.save();
  await product.populate(['category', 'vendor']);

  res.json({ success: true, data: product });
}));

// Delete product
router.delete('/products/:id', [auth, authorize('vendeur')], asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, vendor: req.user._id });
  
  if (!product) {
    return res.status(404).json({ success: false, message: 'Produit non trouvé' });
  }

  await product.deleteOne();
  res.json({ success: true, message: 'Produit supprimé' });
}));

// Get vendor negotiations
router.get('/negotiations', [auth, authorize('vendeur')], asyncHandler(async (req, res) => {
  const negotiations = await Negotiation.find({ vendor: req.user._id })
    .populate(['product', 'customer'])
    .sort({ createdAt: -1 });

  res.json({ success: true, data: negotiations });
}));

// Respond to negotiation
router.put('/negotiations/:id', [auth, authorize('vendeur')], asyncHandler(async (req, res) => {
  const { action, counterOffer } = req.body;

  const negotiation = await Negotiation.findOne({ _id: req.params.id, vendor: req.user._id });
  
  if (!negotiation) {
    return res.status(404).json({ success: false, message: 'Négociation non trouvée' });
  }

  if (action === 'accept') {
    negotiation.status = 'accepted';
    negotiation.finalPrice = negotiation.counterOffer || negotiation.proposedPrice;
  } else if (action === 'reject') {
    negotiation.status = 'rejected';
  } else if (action === 'counter') {
    negotiation.status = 'countered';
    negotiation.counterOffer = counterOffer;
  }

  await negotiation.save();
  await negotiation.populate(['product', 'customer']);

  res.json({ success: true, data: negotiation });
}));

module.exports = router;
