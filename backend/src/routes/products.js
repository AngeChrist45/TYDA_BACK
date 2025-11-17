const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { auth, authorize, activeVendor, productOwnerOrAdmin, optionalAuth } = require('../middleware/auth');
const { validateInput, validateObjectId, validatePagination, validateSort } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Configuration Multer pour upload d'images
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Maximum 5 images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

/**
 * @route   GET /api/products
 * @desc    Obtenir la liste des produits avec filtres et pagination
 * @access  Public
 */
router.get('/', [
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

  // Construction de la requête
  let query = { status: 'valide' };

  // Recherche textuelle
  if (search) {
    query.$text = { $search: search };
  }

  // Filtres
  if (category) query.category = category;
  if (vendor) query.vendor = vendor;
  if (featured === 'true') query.featured = true;
  if (negotiable === 'true') {
    query['negotiation.enabled'] = true;
    query.price = { $gte: process.env.MIN_NEGOTIATION_AMOUNT || 5000 };
  }

  // Filtre prix
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Filtre stock
  if (inStock === 'true') {
    query.$expr = { $gt: ['$inventory.quantity', '$inventory.reserved'] };
  }

  try {
    // Exécuter la requête avec pagination
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

    // Calculer les métadonnées de pagination
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          current: page,
          total: totalPages,
          count: products.length,
          totalItems: total,
          hasNext: hasNextPage,
          hasPrev: hasPrevPage,
          limit
        }
      }
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route   GET /api/products/featured
 * @desc    Obtenir les produits mis en avant
 * @access  Public
 */
router.get('/featured', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 12;

  const products = await Product.find({
    status: 'valide',
    featured: true
  })
    .populate('vendor', 'firstName lastName vendorInfo.businessName')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({
    success: true,
    data: { products }
  });
}));

/**
 * @route   GET /api/products/search/suggestions
 * @desc    Obtenir des suggestions de recherche
 * @access  Public
 */
router.get('/search/suggestions', asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.json({
      success: true,
      data: { suggestions: [] }
    });
  }

  const suggestions = await Product.aggregate([
    {
      $match: {
        status: 'valide',
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { 'specifications.brand': { $regex: q, $options: 'i' } }
        ]
      }
    },
    {
      $group: {
        _id: null,
        titles: { $addToSet: '$title' },
        brands: { $addToSet: '$specifications.brand' }
      }
    },
    {
      $project: {
        suggestions: {
          $slice: [
            { $concatArrays: ['$titles', '$brands'] },
            10
          ]
        }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      suggestions: suggestions[0]?.suggestions || []
    }
  });
}));

/**
 * @route   GET /api/products/:id
 * @desc    Obtenir un produit par ID
 * @access  Public
 */
router.get('/:id', [
  validateObjectId('id'),
  optionalAuth
], asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('vendor', 'firstName lastName vendorInfo.businessName avatar address stats')
    .populate('category', 'name slug parent')
    .lean();

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Produit introuvable'
    });
  }

  // Vérifier la visibilité du produit
  if (product.status !== 'valide' && 
      (!req.user || (req.user.role !== 'admin' && req.user.userId !== product.vendor._id.toString()))) {
    return res.status(404).json({
      success: false,
      message: 'Produit introuvable'
    });
  }

  // Incrémenter les vues (sans attendre)
  Product.findByIdAndUpdate(req.params.id, { $inc: { 'stats.views': 1 } }).exec();

  // Ajouter des informations contextuelles pour l'utilisateur connecté
  let userContext = {};
  if (req.user) {
    userContext.canEdit = req.user.role === 'admin' || req.user.userId === product.vendor._id.toString();
    userContext.canNegotiate = product.negotiation?.enabled && req.user.role === 'client';
  }

  res.json({
    success: true,
    data: {
      product,
      userContext
    }
  });
}));

/**
 * @route   POST /api/products
 * @desc    Créer un nouveau produit
 * @access  Private (Vendeur actif)
 */
router.post('/', [
  auth,
  authorize('vendeur'),
  activeVendor,
  upload.array('images', 5)
], asyncHandler(async (req, res) => {
  const {
    title,
    description,
    price,
    category,
    specifications,
    customAttributes,
    inventory,
    shipping,
    tags,
    seo
  } = req.body;

  // Vérifier que la catégorie existe
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) {
    return res.status(400).json({
      success: false,
      message: 'Catégorie invalide'
    });
  }

  // TODO: Upload des images vers Cloudinary
  const images = [];
  if (req.files && req.files.length > 0) {
    // const cloudinaryUploads = await uploadImagesToCloudinary(req.files);
    // images.push(...cloudinaryUploads);
    
    // Pour l'instant, utiliser des URLs de placeholder
    req.files.forEach((file, index) => {
      images.push({
        url: `https://via.placeholder.com/600x400?text=Image+${index + 1}`,
        alt: `${title} - Image ${index + 1}`,
        isPrimary: index === 0
      });
    });
  }

  // Créer le produit
  const productData = {
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
    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    seo: seo ? JSON.parse(seo) : {}
  };

  const product = new Product(productData);
  await product.save();

  await product.populate([
    { path: 'vendor', select: 'firstName lastName vendorInfo.businessName' },
    { path: 'category', select: 'name slug' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Produit créé avec succès. En attente de validation.',
    data: { product }
  });
}));

/**
 * @route   PUT /api/products/:id
 * @desc    Modifier un produit
 * @access  Private (Propriétaire ou Admin)
 */
router.put('/:id', [
  auth,
  validateObjectId('id'),
  productOwnerOrAdmin,
  upload.array('images', 5)
], asyncHandler(async (req, res) => {
  const product = req.product; // Ajouté par le middleware productOwnerOrAdmin

  // Vérifier si le produit peut être modifié
  if (product.status === 'valide' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Impossible de modifier un produit validé'
    });
  }

  const {
    title,
    description,
    price,
    category,
    specifications,
    customAttributes,
    inventory,
    shipping,
    tags,
    seo
  } = req.body;

  // Valider la catégorie si modifiée
  if (category && category !== product.category.toString()) {
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Catégorie invalide'
      });
    }
  }

  // Préparer les mises à jour
  const updates = {};
  if (title) updates.title = title.trim();
  if (description) updates.description = description.trim();
  if (price) updates.price = parseFloat(price);
  if (category) updates.category = category;
  if (specifications) updates.specifications = JSON.parse(specifications);
  if (customAttributes) updates.customAttributes = JSON.parse(customAttributes);
  if (inventory) updates.inventory = { ...product.inventory, ...JSON.parse(inventory) };
  if (shipping) updates.shipping = { ...product.shipping, ...JSON.parse(shipping) };
  if (tags) updates.tags = tags.split(',').map(tag => tag.trim());
  if (seo) updates.seo = { ...product.seo, ...JSON.parse(seo) };

  // Gérer les nouvelles images
  if (req.files && req.files.length > 0) {
    // TODO: Upload vers Cloudinary et supprimer les anciennes
    const newImages = req.files.map((file, index) => ({
      url: `https://via.placeholder.com/600x400?text=New+Image+${index + 1}`,
      alt: `${updates.title || product.title} - Image ${index + 1}`,
      isPrimary: index === 0 && product.images.length === 0
    }));
    
    updates.images = [...product.images, ...newImages];
  }

  // Remettre en attente si modifié par le vendeur
  if (req.user.role === 'vendeur') {
    updates.status = 'en_attente';
    updates.validation = {};
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate([
    { path: 'vendor', select: 'firstName lastName vendorInfo.businessName' },
    { path: 'category', select: 'name slug' }
  ]);

  res.json({
    success: true,
    message: 'Produit mis à jour avec succès',
    data: { product: updatedProduct }
  });
}));

/**
 * @route   DELETE /api/products/:id
 * @desc    Supprimer un produit
 * @access  Private (Propriétaire ou Admin)
 */
router.delete('/:id', [
  auth,
  validateObjectId('id'),
  productOwnerOrAdmin
], asyncHandler(async (req, res) => {
  const product = req.product;

  // Vérifier si le produit peut être supprimé
  if (product.stats.totalSales > 0) {
    return res.status(403).json({
      success: false,
      message: 'Impossible de supprimer un produit qui a des ventes'
    });
  }

  // TODO: Supprimer les images de Cloudinary
  // await deleteImagesFromCloudinary(product.images);

  await Product.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Produit supprimé avec succès'
  });
}));

/**
 * @route   POST /api/products/:id/images/:imageIndex
 * @desc    Supprimer une image spécifique
 * @access  Private (Propriétaire ou Admin)
 */
router.delete('/:id/images/:imageIndex', [
  auth,
  validateObjectId('id'),
  productOwnerOrAdmin
], asyncHandler(async (req, res) => {
  const product = req.product;
  const imageIndex = parseInt(req.params.imageIndex);

  if (imageIndex < 0 || imageIndex >= product.images.length) {
    return res.status(400).json({
      success: false,
      message: 'Index d\'image invalide'
    });
  }

  if (product.images.length <= 1) {
    return res.status(400).json({
      success: false,
      message: 'Un produit doit avoir au moins une image'
    });
  }

  const imageToDelete = product.images[imageIndex];
  
  // TODO: Supprimer de Cloudinary
  // await deleteImageFromCloudinary(imageToDelete.url);

  // Supprimer l'image du tableau
  product.images.splice(imageIndex, 1);

  // Si c'était l'image principale, définir la première comme principale
  if (imageToDelete.isPrimary && product.images.length > 0) {
    product.images[0].isPrimary = true;
  }

  await product.save();

  res.json({
    success: true,
    message: 'Image supprimée avec succès',
    data: { images: product.images }
  });
}));

/**
 * @route   GET /api/products/vendor/:vendorId
 * @desc    Obtenir les produits d'un vendeur spécifique
 * @access  Public
 */
router.get('/vendor/:vendorId', [
  validateObjectId('vendorId'),
  validatePagination,
  optionalAuth
], asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination;
  const vendorId = req.params.vendorId;

  // Construire la requête selon l'utilisateur
  let query = { vendor: vendorId };
  
  if (!req.user || (req.user.userId !== vendorId && req.user.role !== 'admin')) {
    query.status = 'valide'; // Seuls les produits validés pour le public
  }

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