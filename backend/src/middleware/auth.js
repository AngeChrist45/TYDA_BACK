const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide',
        code: 'INVALID_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur introuvable',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Compte non vérifié',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    req.user = {
      userId: decoded.userId,
      roles: user.roles || ['client'], // Support des rôles multiples
      role: user.roles && user.roles[0] || 'client', // Rétrocompatibilité
      userDoc: user
    };

    next();

  } catch (error) {
    console.error('Erreur auth:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token invalide',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expiré',
        code: 'TOKEN_EXPIRED'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 'SERVER_ERROR'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Support des rôles multiples
    const userRoles = req.user.roles || [req.user.role];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

const requireApprovedVendor = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        error: 'Authentification requise',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Vérifier si l'utilisateur a le rôle vendeur
    const userRoles = req.user.roles || [req.user.role];
    if (!userRoles.includes('vendeur')) {
      return res.status(403).json({
        success: false,
        error: 'Accès vendeur uniquement',
        code: 'VENDOR_ONLY'
      });
    }

    const user = req.user.userDoc;
    
    if (!user.vendorInfo || user.vendorInfo.validationStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'Compte vendeur non approuvé',
        code: 'VENDOR_NOT_APPROVED',
        data: {
          validationStatus: user.vendorInfo?.validationStatus || 'pending',
          rejectionReason: user.vendorInfo?.rejectionReason
        }
      });
    }

    next();

  } catch (error) {
    console.error('Erreur vendeur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      code: 'SERVER_ERROR'
    });
  }
};

const requireAdmin = authorize('admin');
const requireVendor = authorize('vendeur');
const requireClient = authorize('client');

// Middleware optionnel d'authentification
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (user && user.accountStatus === 'active') {
      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        userDoc: user
      };
    } else {
      req.user = null;
    }

    next();

  } catch (error) {
    req.user = null;
    next();
  }
};

// Alias pour compatibilité
const activeVendor = requireApprovedVendor;
const productOwnerOrAdmin = requireApprovedVendor;

module.exports = {
  auth,
  authorize,
  requireAdmin,
  requireVendor,
  requireClient,
  requireApprovedVendor,
  optionalAuth,
  activeVendor,
  productOwnerOrAdmin
};
