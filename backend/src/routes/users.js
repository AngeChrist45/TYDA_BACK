const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { validateInput, validateObjectId, validatePagination } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { changePasswordValidation } = require('../validations/authValidation');

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @access  Private
 */
router.get('/profile', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId)
    .populate('vendorInfo.validatedBy', 'firstName lastName')
    .lean();

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur introuvable'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
}));

/**
 * @route   PUT /api/users/profile
 * @desc    Mettre à jour le profil utilisateur
 * @access  Private
 */
router.put('/profile', auth, asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    address,
    vendorInfo,
    preferences
  } = req.body;

  const user = await User.findById(req.user.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur introuvable'
    });
  }

  // Préparer les mises à jour
  const updates = {};
  if (firstName) updates.firstName = firstName.trim();
  if (lastName) updates.lastName = lastName.trim();
  if (phone) updates.phone = phone;
  if (address) updates.address = { ...user.address, ...address };
  if (preferences) updates.preferences = { ...user.preferences, ...preferences };

  // Mettre à jour les infos vendeur si applicable et autorisé
  if (vendorInfo && user.role === 'vendeur') {
    // Seuls certains champs peuvent être modifiés après validation
    const allowedVendorUpdates = ['businessDescription'];
    const vendorUpdates = {};
    
    allowedVendorUpdates.forEach(field => {
      if (vendorInfo[field] !== undefined) {
        vendorUpdates[field] = vendorInfo[field];
      }
    });

    if (Object.keys(vendorUpdates).length > 0) {
      updates.vendorInfo = { ...user.vendorInfo, ...vendorUpdates };
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user.userId,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: 'Profil mis à jour avec succès',
    data: { user: updatedUser }
  });
}));

/**
 * @route   PUT /api/users/change-password
 * @desc    Changer le mot de passe
 * @access  Private
 */
router.put('/change-password', [
  auth,
  validateInput(changePasswordValidation)
], asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.userId).select('+password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur introuvable'
    });
  }

  // Vérifier le mot de passe actuel
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Mot de passe actuel incorrect'
    });
  }

  // Mettre à jour le mot de passe
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Mot de passe modifié avec succès'
  });
}));

/**
 * @route   POST /api/users/upload-avatar
 * @desc    Uploader un avatar
 * @access  Private
 */
router.post('/upload-avatar', [
  auth,
  // TODO: Ajouter middleware multer pour avatar
], asyncHandler(async (req, res) => {
  // TODO: Implémenter upload avatar vers Cloudinary
  
  const avatarUrl = 'https://via.placeholder.com/150x150?text=Avatar';

  await User.findByIdAndUpdate(req.user.userId, {
    avatar: avatarUrl
  });

  res.json({
    success: true,
    message: 'Avatar mis à jour avec succès',
    data: { avatarUrl }
  });
}));

/**
 * @route   GET /api/users/:id
 * @desc    Obtenir le profil public d'un utilisateur
 * @access  Public (informations limitées)
 */
router.get('/:id', [
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('firstName lastName avatar vendorInfo.businessName vendorInfo.businessDescription stats createdAt')
    .lean();

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur introuvable'
    });
  }

  // Informations publiques seulement
  const publicProfile = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    avatar: user.avatar,
    memberSince: user.createdAt,
    stats: {
      totalReviews: user.stats.totalReviews,
      averageRating: user.stats.averageRating
    }
  };

  // Ajouter les infos vendeur si applicable
  if (user.vendorInfo?.businessName) {
    publicProfile.vendor = {
      businessName: user.vendorInfo.businessName,
      businessDescription: user.vendorInfo.businessDescription,
      stats: {
        totalSales: user.stats.totalSales
      }
    };
  }

  res.json({
    success: true,
    data: { user: publicProfile }
  });
}));

/**
 * @route   GET /api/users
 * @desc    Obtenir la liste des utilisateurs (Admin seulement)
 * @access  Private (Admin)
 */
router.get('/', [
  auth,
  authorize('admin'),
  validatePagination
], asyncHandler(async (req, res) => {
  const { role, status, search } = req.query;
  const { page, limit, skip } = req.pagination;

  // Construction de la requête
  let query = {};
  
  if (role) query.role = role;
  if (status) query.status = status;
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'vendorInfo.businessName': { $regex: search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .populate('vendorInfo.validatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        current: page,
        total: totalPages,
        count: users.length,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      }
    }
  });
}));

/**
 * @route   PUT /api/users/:id
 * @desc    Mettre à jour un utilisateur (Admin ou propriétaire)
 * @access  Private
 */
router.put('/:id', [
  auth,
  validateObjectId('id'),
  authorize('admin') // Temporairement admin seulement
], asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    address,
    preferences,
    status,
    role
  } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur introuvable'
    });
  }

  // Préparer les mises à jour
  const updates = {};
  if (firstName) updates.firstName = firstName.trim();
  if (lastName) updates.lastName = lastName.trim();
  if (phone) updates.phone = phone;
  if (address) updates.address = { ...user.address, ...address };
  if (preferences) updates.preferences = { ...user.preferences, ...preferences };

  // Seuls les admins peuvent modifier le statut et le rôle
  if (req.user.role === 'admin') {
    if (status) updates.status = status;
    if (role) updates.role = role;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: 'Utilisateur mis à jour avec succès',
    data: { user: updatedUser }
  });
}));

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer un utilisateur (Admin seulement)
 * @access  Private (Admin)
 */
router.delete('/:id', [
  auth,
  authorize('admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur introuvable'
    });
  }

  // Vérifier s'il y a des dépendances
  if (user.role === 'vendeur') {
    const Product = require('../models/Product');
    const productsCount = await Product.countDocuments({ vendor: req.params.id });
    
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un vendeur qui a des produits',
        productsCount
      });
    }
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Utilisateur supprimé avec succès'
  });
}));

/**
 * @route   GET /api/users/vendors/pending
 * @desc    Obtenir les vendeurs en attente de validation
 * @access  Private (Admin)
 */
router.get('/vendors/pending', [
  auth,
  authorize('admin'),
  validatePagination
], asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination;

  const [vendors, total] = await Promise.all([
    User.find({
      role: 'vendeur',
      'vendorInfo.validationStatus': 'pending'
    })
      .select('-password')
      .sort({ createdAt: 1 }) // Plus anciens en premier
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments({
      role: 'vendeur',
      'vendorInfo.validationStatus': 'pending'
    })
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      vendors,
      pagination: {
        current: page,
        total: totalPages,
        count: vendors.length,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      }
    }
  });
}));

/**
 * @route   GET /api/users/stats
 * @desc    Obtenir les statistiques des utilisateurs
 * @access  Private (Admin)
 */
router.get('/stats', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalClients: {
          $sum: { $cond: [{ $eq: ['$role', 'client'] }, 1, 0] }
        },
        totalVendors: {
          $sum: { $cond: [{ $eq: ['$role', 'vendeur'] }, 1, 0] }
        },
        activeVendors: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$role', 'vendeur'] },
                { $eq: ['$accountStatus', 'active'] },
                { $eq: ['$vendorInfo.validationStatus', 'approved'] }
              ] },
              1,
              0
            ]
          }
        },
        pendingVendors: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$role', 'vendeur'] }, { $eq: ['$vendorInfo.validationStatus', 'pending'] }] },
              1,
              0
            ]
          }
        },
        verifiedEmails: {
          $sum: { $cond: ['$isEmailVerified', 1, 0] }
        }
      }
    }
  ]);

  // Statistiques par mois (derniers 12 mois)
  const monthlyStats = await User.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          role: '$role'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || {
        totalUsers: 0,
        totalClients: 0,
        totalVendors: 0,
        activeVendors: 0,
        pendingVendors: 0,
        verifiedEmails: 0
      },
      monthly: monthlyStats
    }
  });
}));

module.exports = router;