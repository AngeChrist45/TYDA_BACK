/**
 * Middleware de gestion des erreurs globales
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log de l'erreur pour debugging
  console.error('Erreur API:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? req.user.userId : 'Anonyme'
  });

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const message = 'Données invalides';
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));

    return res.status(400).json({
      success: false,
      message,
      errors
    });
  }

  // Erreur de duplication MongoDB (clé unique)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    const duplicateMessages = {
      email: 'Cette adresse email est déjà utilisée',
      phone: 'Ce numéro de téléphone est déjà utilisé',
      slug: 'Ce nom est déjà utilisé'
    };

    const message = duplicateMessages[field] || `Ce ${field} est déjà utilisé`;

    return res.status(400).json({
      success: false,
      message,
      field,
      value
    });
  }

  // Erreur ObjectId invalide MongoDB
  if (err.name === 'CastError') {
    const message = `Ressource introuvable`;
    return res.status(404).json({
      success: false,
      message
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }

  // Erreur JWT expiré
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expiré'
    });
  }

  // Erreur de taille de fichier (Multer)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Fichier trop volumineux'
    });
  }

  // Erreur de type de fichier (Multer)
  if (err.code === 'LIMIT_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: 'Type de fichier non autorisé'
    });
  }

  // Erreur de connexion MongoDB
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    return res.status(503).json({
      success: false,
      message: 'Service temporairement indisponible. Veuillez réessayer plus tard.'
    });
  }

  // Erreur personnalisée avec status
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Erreur serveur'
    });
  }

  // Erreur de permission
  if (err.message && err.message.includes('permission') || err.message.includes('access')) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé'
    });
  }

  // Erreur générique serveur
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erreur serveur interne' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Classe d'erreur personnalisée
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wrapper pour les fonctions async qui capture automatiquement les erreurs
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Fonction utilitaire pour créer des erreurs personnalisées
 */
const createError = (message, statusCode = 500) => {
  return new AppError(message, statusCode);
};

/**
 * Middleware pour les erreurs de validation spécifiques
 */
const handleValidationError = (error) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => {
      return {
        field: err.path,
        message: err.message
      };
    });

    return new AppError(
      'Erreur de validation des données',
      400,
      errors
    );
  }
  return error;
};

/**
 * Middleware pour gérer les erreurs 404
 */
const handle404 = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} introuvable`,
    method: req.method
  });
};

/**
 * Gestionnaire d'erreurs pour les promesses non gérées
 */
process.on('unhandledRejection', (err, promise) => {
  console.error('Promesse rejetée non gérée:', err.message);
  console.error('Promesse:', promise);
  
  // En production, on pourrait fermer le serveur proprement
  if (process.env.NODE_ENV === 'production') {
    console.log('Fermeture du serveur...');
    process.exit(1);
  }
});

/**
 * Gestionnaire pour les exceptions non capturées
 */
process.on('uncaughtException', (err) => {
  console.error('Exception non capturée:', err.message);
  console.error('Stack:', err.stack);
  
  console.log('Fermeture du serveur...');
  process.exit(1);
});

module.exports = {
  errorHandler,
  AppError,
  asyncHandler,
  createError,
  handleValidationError,
  handle404
};