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

router.put('/vendors/:id/approve', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);
    if (!vendor || vendor.role !== 'vendeur') {
      return res.status(404).json({ success: false, message: 'Vendeur non trouvé' });
    }

    vendor.vendorInfo.validationStatus = 'approved';
    vendor.vendorInfo.validatedAt = new Date();
    vendor.vendorInfo.validatedBy = req.user.id;
    await vendor.save();

    res.json({
      success: true,
      message: 'Vendeur approuvé avec succès',
      data: {
        vendorId: vendor._id,
        validationStatus: vendor.vendorInfo.validationStatus,
        validatedAt: vendor.vendorInfo.validatedAt
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
    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Raison du rejet requise' });
    }

    const vendor = await User.findById(req.params.id);
    if (!vendor || vendor.role !== 'vendeur') {
      return res.status(404).json({ success: false, message: 'Vendeur non trouvé' });
    }

    vendor.vendorInfo.validationStatus = 'rejected';
    vendor.vendorInfo.validatedAt = new Date();
    vendor.vendorInfo.validatedBy = req.user.id;
    vendor.vendorInfo.rejectionReason = rejectionReason;
    await vendor.save();

    res.json({
      success: true,
      message: 'Vendeur rejeté',
      data: {
        vendorId: vendor._id,
        validationStatus: vendor.vendorInfo.validationStatus,
        validatedAt: vendor.vendorInfo.validatedAt,
        rejectionReason
      }
    });
  } catch (error) {
    console.error('Erreur rejet vendeur:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du rejet du vendeur' });
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

module.exports = router;
