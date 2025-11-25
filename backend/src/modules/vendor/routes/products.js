const express = require('express');
const multer = require('multer');
const Product = require('../../../models/Product');
const Category = require('../../../models/Category');
const { auth, authorize, activeVendor, productOwnerOrAdmin } = require('../../../middleware/auth');
const { validateObjectId, validatePagination } = require('../../../middleware/validation');
const { asyncHandler } = require('../../../middleware/errorHandler');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 5 } });

// GET /api/vendor/products/mine
router.get('/products/mine', [ auth, authorize('vendeur'), validatePagination ], asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination;
  const [products, total] = await Promise.all([
    Product.find({ vendor: req.user.userId })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments({ vendor: req.user.userId })
  ]);
  const totalPages = Math.ceil(total / limit);
  res.json({ success: true, data: { products, pagination: { current: page, total: totalPages, count: products.length, totalItems: total, hasNext: page < totalPages, hasPrev: page > 1, limit } } });
}));

// POST /api/vendor/products
router.post('/products', [ auth, authorize('vendeur'), activeVendor, upload.array('images', 5) ], asyncHandler(async (req, res) => {
  console.log('📦 Creating product - Body:', req.body);
  console.log('📷 Files:', req.files?.length || 0);
  
  const { title, description, price, category, specifications, customAttributes, inventory, shipping, tags, seo } = req.body;
  
  // Validation des champs requis
  if (!title || !description || !price || !category) {
    return res.status(400).json({ 
      success: false, 
      message: 'Champs requis manquants',
      missing: {
        title: !title,
        description: !description,
        price: !price,
        category: !category
      }
    });
  }
  
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) return res.status(400).json({ success: false, message: 'Catégorie invalide' });

  const images = [];
  if (req.files?.length) {
    req.files.forEach((file, index) => {
      images.push({ url: `https://via.placeholder.com/600x400?text=Image+${index + 1}`, alt: `${title} - Image ${index + 1}`, isPrimary: index === 0 });
    });
  }

  const product = new Product({
    title: title.trim(),
    description: description.trim(),
    price: parseFloat(price),
    vendor: req.user.userId,
    category,
    images,
    specifications: specifications ? JSON.parse(specifications) : {},
    customAttributes: customAttributes ? JSON.parse(customAttributes) : [],
    inventory: inventory ? JSON.parse(inventory) : { quantity: 1 },
    shipping: shipping ? JSON.parse(shipping) : {},
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
    seo: seo ? JSON.parse(seo) : {}
  });

  await product.save();
  await product.populate([{ path: 'vendor', select: 'firstName lastName vendorInfo.businessName' }, { path: 'category', select: 'name slug' }]);

  res.status(201).json({ success: true, message: 'Produit créé avec succès. En attente de validation.', data: { product } });
}));

// PUT /api/vendor/products/:id
router.put('/products/:id', [ auth, authorize('vendeur'), validateObjectId('id'), productOwnerOrAdmin, upload.array('images', 5) ], asyncHandler(async (req, res) => {
  const product = req.product;
  if (product.status === 'valide' && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Impossible de modifier un produit validé' });

  const { title, description, price, category, specifications, customAttributes, inventory, shipping, tags, seo } = req.body;
  if (category && category !== product.category.toString()) {
    const c = await Category.findById(category);
    if (!c) return res.status(400).json({ success: false, message: 'Catégorie invalide' });
  }

  const updates = {};
  if (title) updates.title = title.trim();
  if (description) updates.description = description.trim();
  if (price) updates.price = parseFloat(price);
  if (category) updates.category = category;
  if (specifications) updates.specifications = JSON.parse(specifications);
  if (customAttributes) updates.customAttributes = JSON.parse(customAttributes);
  if (inventory) updates.inventory = { ...product.inventory, ...JSON.parse(inventory) };
  if (shipping) updates.shipping = { ...product.shipping, ...JSON.parse(shipping) };
  if (tags) updates.tags = tags.split(',').map(t => t.trim());
  if (seo) updates.seo = { ...product.seo, ...JSON.parse(seo) };

  if (req.files?.length) {
    const newImages = req.files.map((file, index) => ({ url: `https://via.placeholder.com/600x400?text=New+Image+${index + 1}`, alt: `${updates.title || product.title} - Image ${index + 1}`, isPrimary: index === 0 && product.images.length === 0 }));
    updates.images = [...product.images, ...newImages];
  }

  if (req.user.role === 'vendeur') {
    updates.status = 'en_attente';
    updates.validation = {};
  }

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    .populate([{ path: 'vendor', select: 'firstName lastName vendorInfo.businessName' }, { path: 'category', select: 'name slug' }]);

  res.json({ success: true, message: 'Produit mis à jour avec succès', data: { product: updatedProduct } });
}));

// DELETE /api/vendor/products/:id
router.delete('/products/:id', [ auth, authorize('vendeur'), validateObjectId('id'), productOwnerOrAdmin ], asyncHandler(async (req, res) => {
  const product = req.product;
  if (product.stats.totalSales > 0) return res.status(403).json({ success: false, message: 'Impossible de supprimer un produit qui a des ventes' });
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Produit supprimé avec succès' });
}));

module.exports = router;
 
// DELETE /api/vendor/products/:id/images/:imageIndex
router.delete('/products/:id/images/:imageIndex', [ auth, authorize('vendeur'), validateObjectId('id'), productOwnerOrAdmin ], asyncHandler(async (req, res) => {
  const product = req.product;
  const imageIndex = parseInt(req.params.imageIndex);
  if (Number.isNaN(imageIndex) || imageIndex < 0 || imageIndex >= product.images.length) {
    return res.status(400).json({ success: false, message: "Index d'image invalide" });
  }
  if (product.images.length <= 1) {
    return res.status(400).json({ success: false, message: 'Un produit doit avoir au moins une image' });
  }
  const imageToDelete = product.images[imageIndex];
  // TODO: supprimer de Cloudinary
  product.images.splice(imageIndex, 1);
  if (imageToDelete.isPrimary && product.images.length > 0) {
    product.images[0].isPrimary = true;
  }
  await product.save();
  res.json({ success: true, message: 'Image supprimée avec succès', data: { images: product.images } });
}));
