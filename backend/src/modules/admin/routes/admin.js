const express = require('express');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const Category = require('../../../models/Category');
const Negotiation = require('../../../models/Negotiation');
const { auth, authorize } = require('../../../middleware/auth');
const { validateInput, validateObjectId } = require('../../../middleware/validation');
const { asyncHandler } = require('../../../middleware/errorHandler');

const router = express.Router();

/**
 * @route   GET /api/admin/dashboard
 * @desc    Obtenir les données du tableau de bord admin
 * @access  Private (Admin)
 */
router.get('/dashboard', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments({ status: 'valide' });
    const totalOrders = 0; // TODO: connecter au modèle Order
    const totalRevenue = 0; // TODO: calculer depuis les commandes
    const pendingVendors = await User.countDocuments({
      role: 'vendeur',
      'vendorInfo.validationStatus': 'pending'
    });
    const activeNegotiations = await Negotiation.countDocuments({ status: 'active' });

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email role createdAt')
      .lean();

    const recentOrders = [];

    const pendingApprovals = await User.find({
      role: 'vendeur',
      'vendorInfo.validationStatus': 'pending'
    })
      .select('firstName lastName email phone vendorInfo createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const systemAlerts = [];
    if (pendingVendors > 5) {
      systemAlerts.push({
        severity: 'warning',
        message: `${pendingVendors} vendeurs en attente d'approbation`
      });
    }
    if (activeNegotiations > 20) {
      systemAlerts.push({
        severity: 'info',
        message: `${activeNegotiations} négociations actives en cours`
      });
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue,
          pendingVendors,
          activeNegotiations
        },
        recentUsers,
        recentOrders,
        pendingApprovals,
        systemAlerts
      }
    });
  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du chargement du tableau de bord' });
  }
}));

/**
 * @route   GET /api/admin/vendor-requests
 * @desc    Obtenir toutes les demandes de vendeurs (tous les statuts)
 * @access  Private (Admin)
 */
router.get('/vendor-requests', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  try {
    const vendors = await User.find({
      'vendorInfo.validationStatus': { $exists: true }
    })
      .select('firstName lastName email phone vendorInfo createdAt accountStatus role')
      .sort({ 'vendorInfo.requestedAt': -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: vendors
    });
  } catch (error) {
    console.error('Erreur récupération vendeurs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des vendeurs' 
    });
  }
}));

router.put('/vendors/:id/approve', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    if (!user.vendorInfo || user.vendorInfo.validationStatus !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucune demande vendeur en attente pour cet utilisateur' 
      });
    }

    // Changer le rôle de client à vendeur
    user.role = 'vendeur';
    user.vendorInfo.validationStatus = 'approved';
    user.vendorInfo.validatedAt = new Date();
    user.vendorInfo.validatedBy = req.user.userId;
    user.vendorInfo.reviewedBy = req.user.userId;

    // Créer une notification pour l'utilisateur
    user.notifications.push({
      type: 'vendor_approved',
      title: '🎉 Demande vendeur approuvée',
      message: `Félicitations ! Votre demande pour devenir vendeur a été approuvée. Vous pouvez maintenant accéder à votre espace vendeur et commencer à ajouter vos produits.`,
      read: false,
      createdAt: new Date(),
      data: {
        businessName: user.vendorInfo.businessName,
        approvedAt: new Date()
      }
    });

    await user.save();

    console.log('[ADMIN] Vendeur approuvé:', { userId: user._id, businessName: user.vendorInfo.businessName });

    res.json({
      success: true,
      message: 'Vendeur approuvé avec succès',
      data: {
        userId: user._id,
        role: user.role,
        validationStatus: user.vendorInfo.validationStatus,
        validatedAt: user.vendorInfo.validatedAt
      }
    });
  } catch (error) {
    console.error('Erreur approbation vendeur:', error);
    res.status(500).json({ success: false, message: "Erreur lors de l'approbation du vendeur" });
  }
}));

router.put('/vendors/:id/reject', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Raison du rejet requise (minimum 10 caractères)' 
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    if (!user.vendorInfo || user.vendorInfo.validationStatus !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucune demande vendeur en attente pour cet utilisateur' 
      });
    }

    // Rejeter la demande (reste client)
    user.vendorInfo.validationStatus = 'rejected';
    user.vendorInfo.validatedAt = new Date();
    user.vendorInfo.validatedBy = req.user.userId;
    user.vendorInfo.reviewedBy = req.user.userId;
    user.vendorInfo.rejectionReason = rejectionReason.trim();

    // Créer une notification pour l'utilisateur
    user.notifications.push({
      type: 'vendor_rejected',
      title: '❌ Demande vendeur rejetée',
      message: `Votre demande pour devenir vendeur a été rejetée. Motif : ${rejectionReason.trim()}`,
      read: false,
      createdAt: new Date(),
      data: {
        businessName: user.vendorInfo.businessName,
        rejectionReason: rejectionReason.trim(),
        rejectedAt: new Date()
      }
    });

    await user.save();

    console.log('[ADMIN] Vendeur rejeté:', { userId: user._id, reason: rejectionReason });

    res.json({
      success: true,
      message: 'Demande vendeur rejetée',
      data: {
        userId: user._id,
        validationStatus: user.vendorInfo.validationStatus,
        validatedAt: user.vendorInfo.validatedAt,
        rejectionReason
      }
    });
  } catch (error) {
    console.error('Erreur rejet vendeur:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du rejet de la demande' });
  }
}));

router.get('/vendors/pending', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [vendors, total] = await Promise.all([
    User.find({ role: 'vendeur', 'vendorInfo.validationStatus': 'pending' })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean(),
    User.countDocuments({ role: 'vendeur', 'vendorInfo.validationStatus': 'pending' })
  ]);

  const totalPages = Math.ceil(total / limit);
  res.json({
    success: true,
    data: {
      vendors,
      pagination: {
        current: parseInt(page, 10),
        total: totalPages,
        count: vendors.length,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: parseInt(limit, 10)
      }
    }
  });
}));

router.put('/vendors/:id/validate', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const { action, rejectionReason } = req.body;
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Action invalide. Utilisez "approve" ou "reject"' });
  }

  const vendor = await User.findById(req.params.id);
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendeur introuvable' });
  }
  if (vendor.role !== 'vendeur') {
    return res.status(400).json({ success: false, message: "Cet utilisateur n'est pas un vendeur" });
  }
  if (vendor.vendorInfo.validationStatus !== 'pending') {
    return res.status(400).json({ success: false, message: "Ce vendeur n'est pas en attente de validation" });
  }

  if (action === 'approve') {
    vendor.vendorInfo.validationStatus = 'approved';
    vendor.vendorInfo.validatedAt = new Date();
    vendor.vendorInfo.validatedBy = req.user.userId;
    vendor.vendorInfo.rejectionReason = undefined;
    await vendor.save();
    res.json({ success: true, message: 'Vendeur validé avec succès', data: { vendor } });
  } else {
    if (!rejectionReason?.trim()) {
      return res.status(400).json({ success: false, message: 'Motif de refus requis' });
    }
    vendor.vendorInfo.validationStatus = 'rejected';
    vendor.vendorInfo.rejectionReason = rejectionReason.trim();
    vendor.vendorInfo.validatedBy = req.user.userId;
    await vendor.save();
    res.json({ success: true, message: 'Vendeur refusé', data: { vendor } });
  }
}));

router.get('/products/pending', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find({ status: 'en_attente' })
      .populate('vendor', 'firstName lastName vendorInfo.businessName')
      .populate('category', 'name')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean(),
    Product.countDocuments({ status: 'en_attente' })
  ]);

  const totalPages = Math.ceil(total / limit);
  res.json({
    success: true,
    data: {
      products,
      pagination: {
        current: parseInt(page, 10),
        total: totalPages,
        count: products.length,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: parseInt(limit, 10)
      }
    }
  });
}));

router.put('/products/:id/validate', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const {
    action,
    rejectionReason,
    adminNotes,
    enableNegotiation,
    negotiationPercentage
  } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Action invalide. Utilisez "approve" ou "reject"' });
  }

  const product = await Product.findById(req.params.id)
    .populate('vendor', 'firstName lastName email');
  if (!product) {
    return res.status(404).json({ success: false, message: 'Produit introuvable' });
  }
  if (product.status !== 'en_attente') {
    return res.status(400).json({ success: false, message: "Ce produit n'est pas en attente de validation" });
  }

  if (action === 'approve') {
    product.status = 'valide';
    product.validation.validatedBy = req.user.userId;
    product.validation.validatedAt = new Date();
    product.validation.adminNotes = adminNotes;
    product.validation.rejectionReason = undefined;

    if (enableNegotiation === true) {
      const minAmount = process.env.MIN_NEGOTIATION_AMOUNT || 5000;
      if (product.price >= minAmount) {
        if (!negotiationPercentage || negotiationPercentage < 1 || negotiationPercentage > 50) {
          return res.status(400).json({ success: false, message: 'Pourcentage de négociation invalide (1-50%)' });
        }
        await product.enableNegotiation(negotiationPercentage, req.user.userId);
      } else {
        return res.status(400).json({ success: false, message: `Prix trop bas pour activer la négociation (minimum ${minAmount} FCFA)` });
      }
    }

    await product.save();
    res.json({ success: true, message: 'Produit validé avec succès', data: { product } });
  } else {
    if (!rejectionReason?.trim()) {
      return res.status(400).json({ success: false, message: 'Motif de refus requis' });
    }
    product.status = 'refuse';
    product.validation.rejectionReason = rejectionReason.trim();
    product.validation.validatedBy = req.user.userId;
    product.validation.validatedAt = new Date();
    product.validation.adminNotes = adminNotes;
    await product.save();
    res.json({ success: true, message: 'Produit refusé', data: { product } });
  }
}));

router.get('/users', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  const {
    role,
    status,
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (page - 1) * limit;
  const query = {};
  if (role) query.role = role;
  if (status) query.accountStatus = status;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'vendorInfo.businessName': { $regex: search, $options: 'i' } }
    ];
  }

  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .populate('vendorInfo.validatedBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean(),
    User.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);
  res.json({
    success: true,
    data: {
      users,
      pagination: {
        current: parseInt(page, 10),
        total: totalPages,
        count: users.length,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: parseInt(limit, 10)
      }
    }
  });
}));

router.put('/users/:id/status', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const validStatuses = ['pending_verification', 'active', 'suspended', 'deleted'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Statut invalide. Statuts autorisés: ${validStatuses.join(', ')}` });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
  }
  if (user.role === 'admin') {
    return res.status(403).json({ success: false, message: "Impossible de modifier le statut d'un administrateur" });
  }

  user.accountStatus = status;
  if (status === 'deleted' && user.role === 'vendeur') {
    user.vendorInfo.rejectionReason = reason;
  }
  await user.save();

  res.json({ success: true, message: `Statut utilisateur modifié vers "${status}"`, data: { user } });
}));

router.get('/analytics', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  const userAnalytics = await User.aggregate([
    {
      $group: {
        _id: {
          role: '$role',
          accountStatus: '$accountStatus',
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } }
  ]);

  const productAnalytics = await Product.aggregate([
    {
      $group: {
        _id: {
          status: '$status',
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        totalValue: { $sum: '$price' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } }
  ]);

  const negotiationAnalytics = await Negotiation.aggregate([
    {
      $group: {
        _id: {
          status: '$status',
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        count: { $sum: 1 },
        avgSavings: { $avg: '$savingsPercentage' },
        totalSavings: { $sum: '$savings' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } }
  ]);

  const topCategories = await Category.aggregate([
    { $match: { isActive: true } },
    { $sort: { 'stats.productCount': -1 } },
    { $limit: 10 },
    {
      $project: {
        name: 1,
        productCount: '$stats.productCount',
        totalSales: '$stats.totalSales'
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      users: userAnalytics,
      products: productAnalytics,
      negotiations: negotiationAnalytics,
      topCategories
    }
  });
}));

router.post('/system/cleanup', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  try {
    const expiredNegotiations = await Negotiation.cleanupExpired();
    res.json({
      success: true,
      message: 'Nettoyage système effectué',
      data: {
        expiredNegotiations
      }
    });
  } catch (error) {
    throw error;
  }
}));

router.get('/reports/export', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  const { type, format = 'json', startDate, endDate } = req.query;
  res.json({
    success: true,
    message: 'Export de rapport à implémenter',
    data: {
      type,
      format,
      dateRange: { startDate, endDate }
    }
  });
}));

/**
 * @route   GET /api/admin/stats/dashboard
 * @desc    Statistiques pour le backoffice dashboard
 * @access  Private (Admin)
 */
router.get('/stats/dashboard', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  try {
    const Order = require('../../../models/Order');
    
    // Période pour calculer les changements (30 derniers jours)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

    // Compter les éléments actuels et précédents
    const [
      currentOrders,
      previousOrders,
      currentUsers,
      previousUsers,
      currentProducts,
      pendingProducts,
      totalRevenue,
      previousRevenue
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }).catch(() => 0),
      Order.countDocuments({ 
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } 
      }).catch(() => 0),
      User.countDocuments({ 
        role: { $in: ['client', 'vendeur'] },
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      User.countDocuments({ 
        role: { $in: ['client', 'vendeur'] },
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } 
      }),
      Product.countDocuments({ status: 'valide' }),
      Product.countDocuments({ status: 'en_attente' }),
      Order.aggregate([
        { $match: { 
          paymentStatus: 'paid',
          createdAt: { $gte: thirtyDaysAgo }
        }},
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(res => res[0]?.total || 0).catch(() => 0),
      Order.aggregate([
        { $match: { 
          paymentStatus: 'paid',
          createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
        }},
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(res => res[0]?.total || 0).catch(() => 0)
    ]);

    // Calculer les pourcentages de changement
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Commandes récentes
    const recentOrders = await Order.find()
      .populate('customer', 'firstName lastName phone')
      .populate('items.product', 'title images')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .catch(() => []);

    // Produits populaires (par ventes)
    const popularProducts = await Product.find({ status: 'valide' })
      .sort({ 'stats.totalSales': -1, 'stats.views': -1 })
      .limit(5)
      .select('title price stats images')
      .lean();

    const stats = {
      revenue: {
        total: totalRevenue,
        change: calculateChange(totalRevenue, previousRevenue),
        currency: 'FCFA'
      },
      orders: {
        total: currentOrders,
        change: calculateChange(currentOrders, previousOrders),
        pending: await Order.countDocuments({ status: 'pending' }).catch(() => 0)
      },
      products: {
        total: currentProducts,
        change: 0, // Pas de comparaison temporelle pour les produits
        pending: pendingProducts
      },
      users: {
        total: currentUsers,
        change: calculateChange(currentUsers, previousUsers),
        clients: await User.countDocuments({ role: 'client' }),
        vendors: await User.countDocuments({ role: 'vendeur' })
      },
      recentOrders,
      popularProducts
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur stats dashboard:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * @route   GET /api/admin/products
 * @desc    Obtenir tous les produits (pour backoffice admin)
 * @access  Private (Admin)
 */
router.get('/products', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  try {
    const products = await Product.find()
      .populate('vendor', 'firstName lastName vendorInfo')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Erreur récupération produits:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des produits' 
    });
  }
}));

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Supprimer un produit
 * @access  Private (Admin)
 */
router.delete('/products/:id', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Produit non trouvé' 
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Produit supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression produit:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression du produit' 
    });
  }
}));

/**
 * @route   GET /api/admin/orders
 * @desc    Obtenir toutes les commandes
 * @access  Private (Admin)
 */
router.get('/orders', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  try {
    const Order = require('../../../models/Order');
    
    const orders = await Order.find()
      .populate('customer', 'firstName lastName email phone')
      .populate({
        path: 'items.product',
        select: 'name price images'
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des commandes' 
    });
  }
}));

/**
 * @route   PUT /api/admin/orders/:id/status
 * @desc    Mettre à jour le statut d'une commande
 * @access  Private (Admin)
 */
router.put('/orders/:id/status', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  try {
    const Order = require('../../../models/Order');
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Statut invalide' 
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Commande non trouvée' 
      });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      updatedBy: req.user.userId,
      note: `Statut mis à jour par l'administrateur`
    });

    await order.save();

    res.json({
      success: true,
      message: 'Statut de la commande mis à jour',
      data: order
    });
  } catch (error) {
    console.error('Erreur mise à jour commande:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour de la commande' 
    });
  }
}));

/**
 * @route   GET /api/admin/categories
 * @desc    Obtenir toutes les catégories
 * @access  Private (Admin)
 */
router.get('/categories', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('parent', 'name')
      .sort({ level: 1, name: 1 })
      .lean();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des catégories' 
    });
  }
}));

/**
 * @route   POST /api/admin/categories
 * @desc    Créer une nouvelle catégorie
 * @access  Private (Admin)
 */
router.post('/categories', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  try {
    const { name, description, parent, icon, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le nom est requis' 
      });
    }

    const category = new Category({
      name,
      description,
      parent: parent || null,
      icon,
      isActive: isActive !== undefined ? isActive : true
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: category
    });
  } catch (error) {
    console.error('Erreur création catégorie:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création de la catégorie' 
    });
  }
}));

/**
 * @route   PUT /api/admin/categories/:id
 * @desc    Mettre à jour une catégorie
 * @access  Private (Admin)
 */
router.put('/categories/:id', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  try {
    const { name, description, parent, icon, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Catégorie non trouvée' 
      });
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (parent !== undefined) category.parent = parent;
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      message: 'Catégorie mise à jour avec succès',
      data: category
    });
  } catch (error) {
    console.error('Erreur mise à jour catégorie:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour de la catégorie' 
    });
  }
}));

/**
 * @route   DELETE /api/admin/categories/:id
 * @desc    Supprimer une catégorie
 * @access  Private (Admin)
 */
router.delete('/categories/:id', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Catégorie non trouvée' 
      });
    }

    // Vérifier s'il y a des produits liés
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Impossible de supprimer : ${productCount} produit(s) utilisent cette catégorie` 
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Catégorie supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression catégorie:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression de la catégorie' 
    });
  }
}));

module.exports = router;
