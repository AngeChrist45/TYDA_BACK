const express = require('express');
const Product = require('../../../models/Product');
const Category = require('../../../models/Category');
const { optionalAuth } = require('../../../middleware/auth');
const { validateObjectId, validatePagination, validateSort } = require('../../../middleware/validation');
const { asyncHandler } = require('../../../middleware/errorHandler');

const router = express.Router();

router.get('/products', [
  optionalAuth,
  validatePagination,
  validateSort(['title', 'price', 'createdAt', 'stats.views', 'stats.totalSales'])
], asyncHandler(async (req, res) => {
  const {
    search,
    category,
    vendor,
    minPrice,
    maxPrice,
    featured,
    inStock,
    negotiable
  } = req.query;

  const { page, limit, skip } = req.pagination;
  const sort = req.sort?.mongoSort || { createdAt: -1 };

  let query = { status: 'valide' };

  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (vendor) query.vendor = vendor;
  if (featured === 'true') query.featured = true;
  if (negotiable === 'true') {
    query['negotiation.enabled'] = true;
    query.price = { $gte: process.env.MIN_NEGOTIATION_AMOUNT || 5000 };
  }
  if (minPrice || maxPrice) {
    query.price = query.price || {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }
  if (inStock === 'true') {
    query.$expr = { $gt: ['$inventory.quantity', '$inventory.reserved'] };
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('vendor', 'firstName lastName vendorInfo.businessName avatar')
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        current: page,
        total: totalPages,
        count: products.length,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      }
    }
  });
}));

// GET /api/client/products/featured
router.get('/products/featured', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 12;
  const products = await Product.find({ status: 'valide', featured: true })
    .populate('vendor', 'firstName lastName vendorInfo.businessName')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({ success: true, data: { products } });
}));

// GET /api/client/products/search/suggestions
router.get('/products/search/suggestions', asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ success: true, data: { suggestions: [] } });

  const suggestions = await Product.aggregate([
    { $match: { status: 'valide', $or: [{ title: { $regex: q, $options: 'i' } }, { 'specifications.brand': { $regex: q, $options: 'i' } }] } },
    { $group: { _id: null, titles: { $addToSet: '$title' }, brands: { $addToSet: '$specifications.brand' } } },
    { $project: { suggestions: { $slice: [{ $concatArrays: ['$titles', '$brands'] }, 10] } } }
  ]);

  res.json({ success: true, data: { suggestions: suggestions[0]?.suggestions || [] } });
}));

// GET /api/client/products/:id
router.get('/products/:id', [validateObjectId('id'), optionalAuth], asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('vendor', 'firstName lastName vendorInfo.businessName avatar address stats')
    .populate('category', 'name slug parent')
    .lean();

  if (!product || product.status !== 'valide') {
    return res.status(404).json({ success: false, message: 'Produit introuvable' });
  }

  Product.findByIdAndUpdate(req.params.id, { $inc: { 'stats.views': 1 } }).exec();

  const userContext = req.user ? { canNegotiate: product.negotiation?.enabled && req.user.role === 'client' } : {};

  res.json({ success: true, data: { product, userContext } });
}));

// GET /api/client/products/vendor/:vendorId
router.get('/products/vendor/:vendorId', [validateObjectId('vendorId'), validatePagination, optionalAuth], asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination;
  const vendorId = req.params.vendorId;
  const query = { vendor: vendorId, status: 'valide' };

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        current: page,
        total: totalPages,
        count: products.length,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      }
    }
  });
}));

module.exports = router;
