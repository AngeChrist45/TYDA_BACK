const express = require('express');
const Category = require('../models/Category');
const { auth, authorize, optionalAuth } = require('../middleware/auth');
const { validateInput, validateObjectId } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Obtenir toutes les catégories actives
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const { tree, popular, parent, level } = req.query;

  // Si demande d'arbre complet
  if (tree === 'true') {
    const categoryTree = await Category.getCategoryTree();
    return res.json({
      success: true,
      data: { categories: categoryTree }
    });
  }

  // Si demande des catégories populaires
  if (popular === 'true') {
    const limit = parseInt(req.query.limit) || 10;
    const popularCategories = await Category.getPopularCategories(limit);
    return res.json({
      success: true,
      data: { categories: popularCategories }
    });
  }

  // Requête normale avec filtres
  let query = { isActive: true };
  
  if (parent) {
    query.parent = parent === 'null' ? null : parent;
  }
  
  if (level !== undefined) {
    query.level = parseInt(level);
  }

  const categories = await Category.find(query)
    .sort({ sortOrder: 1, name: 1 })
    .populate('parent', 'name slug')
    .lean();

  res.json({
    success: true,
    data: { categories }
  });
}));

/**
 * @route   GET /api/categories/:id
 * @desc    Obtenir une catégorie par ID
 * @access  Public
 */
router.get('/:id', [
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate('parent', 'name slug')
    .populate('subcategories')
    .lean();

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Catégorie introuvable'
    });
  }

  res.json({
    success: true,
    data: { category }
  });
}));

/**
 * @route   GET /api/categories/slug/:slug
 * @desc    Obtenir une catégorie par slug
 * @access  Public
 */
router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const category = await Category.findOne({ 
    slug: req.params.slug,
    isActive: true 
  })
    .populate('parent', 'name slug')
    .populate('subcategories')
    .lean();

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Catégorie introuvable'
    });
  }

  res.json({
    success: true,
    data: { category }
  });
}));

/**
 * @route   POST /api/categories
 * @desc    Créer une nouvelle catégorie
 * @access  Private (Admin seulement)
 */
router.post('/', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  const {
    name,
    description,
    parent,
    icon,
    image,
    meta,
    theme,
    sortOrder
  } = req.body;

  // Valider les données requises
  if (!name?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Le nom de la catégorie est requis'
    });
  }

  // Déterminer le niveau
  let level = 0;
  if (parent) {
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      return res.status(400).json({
        success: false,
        message: 'Catégorie parent introuvable'
      });
    }
    level = parentCategory.level + 1;
    
    if (level > 3) {
      return res.status(400).json({
        success: false,
        message: 'Niveau maximum de catégories atteint (3)'
      });
    }
  }

  const categoryData = {
    name: name.trim(),
    description: description?.trim(),
    parent: parent || null,
    level,
    icon: icon || 'fas fa-tag',
    image,
    meta: meta || {},
    theme: {
      primaryColor: theme?.primaryColor || '#FF7F00',
      secondaryColor: theme?.secondaryColor || '#FFFFFF',
      accentColor: theme?.accentColor || '#00B04F'
    },
    sortOrder: sortOrder || 0
  };

  const category = new Category(categoryData);
  await category.save();

  res.status(201).json({
    success: true,
    message: 'Catégorie créée avec succès',
    data: { category }
  });
}));

/**
 * @route   PUT /api/categories/:id
 * @desc    Modifier une catégorie
 * @access  Private (Admin seulement)
 */
router.put('/:id', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const {
    name,
    description,
    parent,
    icon,
    image,
    meta,
    theme,
    sortOrder,
    isActive
  } = req.body;

  const category = await Category.findById(req.params.id);
  
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Catégorie introuvable'
    });
  }

  // Vérifier si le parent n'est pas un descendant
  if (parent && parent !== category.parent?.toString()) {
    const descendants = await category.getDescendants();
    const descendantIds = descendants.map(d => d._id.toString());
    
    if (descendantIds.includes(parent)) {
      return res.status(400).json({
        success: false,
        message: 'Une catégorie ne peut pas être son propre descendant'
      });
    }
  }

  // Calculer le nouveau niveau si nécessaire
  let level = category.level;
  if (parent !== undefined) {
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Catégorie parent introuvable'
        });
      }
      level = parentCategory.level + 1;
    } else {
      level = 0;
    }
  }

  // Préparer les mises à jour
  const updates = {};
  if (name) updates.name = name.trim();
  if (description !== undefined) updates.description = description?.trim();
  if (parent !== undefined) updates.parent = parent || null;
  if (level !== category.level) updates.level = level;
  if (icon) updates.icon = icon;
  if (image !== undefined) updates.image = image;
  if (meta) updates.meta = { ...category.meta, ...meta };
  if (theme) updates.theme = { ...category.theme, ...theme };
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  if (isActive !== undefined) updates.isActive = isActive;

  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate('parent', 'name slug');

  res.json({
    success: true,
    message: 'Catégorie mise à jour avec succès',
    data: { category: updatedCategory }
  });
}));

/**
 * @route   DELETE /api/categories/:id
 * @desc    Supprimer une catégorie
 * @access  Private (Admin seulement)
 */
router.delete('/:id', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Catégorie introuvable'
    });
  }

  // Vérifier s'il y a des sous-catégories
  const subcategories = await Category.find({ parent: req.params.id });
  if (subcategories.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Impossible de supprimer une catégorie qui a des sous-catégories',
      subcategoriesCount: subcategories.length
    });
  }

  // Vérifier s'il y a des produits
  const Product = require('../models/Product');
  const productsCount = await Product.countDocuments({ category: req.params.id });
  
  if (productsCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Impossible de supprimer une catégorie qui contient des produits',
      productsCount
    });
  }

  await Category.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Catégorie supprimée avec succès'
  });
}));

/**
 * @route   PUT /api/categories/:id/toggle-status
 * @desc    Activer/désactiver une catégorie
 * @access  Private (Admin seulement)
 */
router.put('/:id/toggle-status', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Catégorie introuvable'
    });
  }

  category.isActive = !category.isActive;
  await category.save();

  res.json({
    success: true,
    message: `Catégorie ${category.isActive ? 'activée' : 'désactivée'} avec succès`,
    data: { category }
  });
}));

/**
 * @route   PUT /api/categories/:id/update-stats
 * @desc    Mettre à jour les statistiques d'une catégorie
 * @access  Private (Admin seulement)
 */
router.put('/:id/update-stats', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Catégorie introuvable'
    });
  }

  await category.updateStats();

  res.json({
    success: true,
    message: 'Statistiques mises à jour avec succès',
    data: { 
      stats: category.stats 
    }
  });
}));

/**
 * @route   GET /api/categories/:id/products
 * @desc    Obtenir les produits d'une catégorie
 * @access  Public
 */
router.get('/:id/products', [
  validateObjectId('id'),
  optionalAuth
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const skip = (page - 1) * limit;

  const category = await Category.findById(req.params.id);
  
  if (!category || !category.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Catégorie introuvable'
    });
  }

  // Inclure les sous-catégories
  const descendants = await category.getDescendants();
  const categoryIds = [req.params.id, ...descendants.map(d => d._id)];

  const Product = require('../models/Product');
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [products, total] = await Promise.all([
    Product.find({ 
      category: { $in: categoryIds },
      status: 'valide'
    })
      .populate('vendor', 'firstName lastName vendorInfo.businessName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Product.countDocuments({ 
      category: { $in: categoryIds },
      status: 'valide'
    })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
        description: category.description
      },
      products,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        count: products.length,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: parseInt(limit)
      }
    }
  });
}));

/**
 * @route   POST /api/categories/bulk-update-stats
 * @desc    Mettre à jour les statistiques de toutes les catégories
 * @access  Private (Admin seulement)
 */
router.post('/bulk-update-stats', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  const categories = await Category.find({});
  
  let updatedCount = 0;
  
  for (const category of categories) {
    try {
      await category.updateStats();
      updatedCount++;
    } catch (error) {
      console.error(`Erreur mise à jour stats catégorie ${category._id}:`, error);
    }
  }

  res.json({
    success: true,
    message: `Statistiques mises à jour pour ${updatedCount} catégories`,
    data: { 
      total: categories.length,
      updated: updatedCount
    }
  });
}));

module.exports = router;