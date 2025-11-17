/**
 * Middleware de validation des données d'entrée
 */
const validateInput = (validationSchema) => {
  return (req, res, next) => {
    console.log('🔍 Validation des données:', req.body);
    
    const { error, value } = validationSchema.validate(req.body, {
      abortEarly: false, // Retourner toutes les erreurs
      allowUnknown: false, // Rejeter les champs non définis
      stripUnknown: true // Supprimer les champs non définis
    });

    if (error) {
      console.log('❌ Erreurs de validation:', error.details);
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors
      });
    }

    console.log('✅ Validation réussie, données nettoyées:', value);
    // Remplacer req.body par les données validées et nettoyées
    req.body = value;
    next();
  };
};

/**
 * Middleware de validation des paramètres d'URL
 */
const validateParams = (validationSchema) => {
  return (req, res, next) => {
    const { error, value } = validationSchema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors
      });
    }

    req.params = value;
    next();
  };
};

/**
 * Middleware de validation des query parameters
 */
const validateQuery = (validationSchema) => {
  return (req, res, next) => {
    const { error, value } = validationSchema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true, // Plus permissif pour les query params
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Paramètres de requête invalides',
        errors
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Middleware de validation des fichiers uploadés
 */
const validateFile = (options = {}) => {
  const {
    required = false,
    maxSize = 5 * 1024 * 1024, // 5MB par défaut
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles = 1
  } = options;

  return (req, res, next) => {
    // Si aucun fichier et non requis, continuer
    if (!req.files && !req.file && !required) {
      return next();
    }

    // Si requis mais aucun fichier
    if ((!req.files && !req.file) && required) {
      return res.status(400).json({
        success: false,
        message: 'Fichier requis'
      });
    }

    const files = req.files || (req.file ? [req.file] : []);

    // Vérifier le nombre de fichiers
    if (files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxFiles} fichier(s) autorisé(s)`
      });
    }

    // Valider chaque fichier
    for (const file of files) {
      // Vérifier la taille
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `Fichier trop volumineux. Taille maximum: ${maxSize / (1024 * 1024)}MB`
        });
      }

      // Vérifier le type MIME
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
        });
      }
    }

    next();
  };
};

/**
 * Middleware pour nettoyer et standardiser les données
 */
const sanitizeInput = (req, res, next) => {
  // Fonction récursive pour nettoyer les objets
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      if (typeof obj === 'string') {
        // Supprimer les espaces en début et fin
        return obj.trim();
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitize(value);
    }
    return sanitized;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

/**
 * Middleware pour valider les ID MongoDB
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const mongoose = require('mongoose');
    const id = req.params[paramName];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `ID invalide: ${paramName}`
      });
    }

    next();
  };
};

/**
 * Middleware pour valider la pagination
 */
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  // Limites raisonnables
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Le numéro de page doit être supérieur à 0'
    });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'La limite doit être entre 1 et 100'
    });
  }

  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };

  next();
};

/**
 * Middleware de validation de l'ordre de tri
 */
const validateSort = (allowedFields = []) => {
  return (req, res, next) => {
    if (!req.query.sortBy) {
      return next();
    }

    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder || 'desc';

    // Vérifier si le champ est autorisé
    if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Champ de tri non autorisé. Champs disponibles: ${allowedFields.join(', ')}`
      });
    }

    // Vérifier l'ordre de tri
    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({
        success: false,
        message: 'L\'ordre de tri doit être "asc" ou "desc"'
      });
    }

    req.sort = {
      field: sortBy,
      order: sortOrder,
      mongoSort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    next();
  };
};

module.exports = {
  validateInput,
  validateParams,
  validateQuery,
  validateFile,
  sanitizeInput,
  validateObjectId,
  validatePagination,
  validateSort
};