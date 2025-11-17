const express = require('express');
const rateLimit = require('express-rate-limit');
const authService = require('../services/authService');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Rate limiting
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: 'Trop de tentatives. Réessayez dans 15 minutes.',
    code: 'TOO_MANY_ATTEMPTS'
  }
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Trop de demandes de code. Réessayez dans 5 minutes.',
    code: 'TOO_MANY_OTP_REQUESTS'
  }
});

// Validation
const validateRegistration = [
  body('firstName').trim().isLength({ min: 2 }).withMessage('Prénom requis'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Nom requis'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('phone').matches(/^\+225[0-9]{8,10}$/).withMessage('Téléphone ivoirien invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court'),
  body('role').optional().isIn(['client', 'vendeur']).withMessage('Rôle invalide')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Erreurs de validation',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }
  next();
};

// Routes
router.post('/register', [registerLimiter, ...validateRegistration, handleValidationErrors], async (req, res) => {
  try {
    console.log('Inscription:', { email: req.body.email, role: req.body.role });

    const result = await authService.registerUser(req.body);

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
        nextStep: 'verification_required'
      }
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    
    if (error.message.includes('existe')) {
      statusCode = 409;
      errorCode = 'USER_EXISTS';
    }

    res.status(statusCode).json({
      success: false,
      error: error.message,
      code: errorCode
    });
  }
});

router.post('/request-verification', [otpLimiter], async (req, res) => {
  try {
    const { identifier, method = 'email' } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Email ou téléphone requis',
        code: 'MISSING_IDENTIFIER'
      });
    }

    console.log('Demande OTP vérification:', { identifier, method });

    const result = await authService.requestVerificationOTP(identifier, method);

    res.json({
      success: true,
      message: result.message,
      data: {
        expiresIn: result.expiresIn,
        sentVia: result.sentVia,
        nextStep: 'verify_otp'
      }
    });

  } catch (error) {
    console.error('Erreur demande OTP:', error);
    
    let statusCode = 400;
    if (error.message.includes('introuvable')) statusCode = 404;

    res.status(statusCode).json({
      success: false,
      error: error.message,
      code: 'OTP_REQUEST_ERROR'
    });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { identifier, otpCode } = req.body;

    if (!identifier || !otpCode) {
      return res.status(400).json({
        success: false,
        error: 'Identifiant et code OTP requis',
        code: 'MISSING_FIELDS'
      });
    }

    console.log('Vérification OTP:', { identifier });

    const result = await authService.verifyOTP(identifier, otpCode);

    res.json({
      success: true,
      message: result.message,
      data: {
        token: result.token,
        user: result.user,
        authenticated: true
      }
    });

  } catch (error) {
    console.error('Erreur vérification OTP:', error);
    
    res.status(400).json({
      success: false,
      error: error.message,
      code: 'OTP_VERIFICATION_ERROR'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password, otpCode, loginMethod = 'password' } = req.body;

    console.log('Connexion:', { identifier, loginMethod });

    let result;

    if (loginMethod === 'otp' && otpCode) {
      result = await authService.loginWithOTP(identifier, otpCode);
    } else if (loginMethod === 'password' && password) {
      result = await authService.loginWithPassword(identifier, password);
    } else if (loginMethod === 'request_otp') {
      result = await authService.requestLoginOTP(identifier);
      return res.json({
        success: true,
        message: result.message,
        data: {
          expiresIn: result.expiresIn,
          sentVia: result.sentVia,
          nextStep: 'enter_otp'
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Méthode de connexion invalide',
        code: 'INVALID_LOGIN_METHOD'
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        token: result.token,
        user: result.user,
        authenticated: true
      }
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    
    let statusCode = 401;
    if (error.message.includes('verrouillé')) statusCode = 423;

    res.status(statusCode).json({
      success: false,
      error: error.message,
      code: 'LOGIN_ERROR'
    });
  }
});

module.exports = router;
