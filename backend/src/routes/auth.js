const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const otpService = require('../services/otpService');
const jwt = require('jsonwebtoken');
const {
  registerValidation,
  verifyOtpValidation,
  setPinValidation,
  loginValidation,
  requestOtpValidation,
  changePinValidation
} = require('../validations/authValidation');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Rate limiters
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    success: false,
    error: 'Trop de tentatives d\'inscription. Réessayez dans 15 minutes.',
    code: 'TOO_MANY_REGISTER_ATTEMPTS'
  }
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: {
    success: false,
    error: 'Trop de demandes de code OTP. Réessayez dans 5 minutes.',
    code: 'TOO_MANY_OTP_REQUESTS'
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    code: 'TOO_MANY_LOGIN_ATTEMPTS'
  }
});

// Helper pour valider Joi
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Erreur de validation',
        code: 'VALIDATION_ERROR',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }
    req.validatedBody = value;
    next();
  };
};

// **ÉTAPE 1: Inscription - Envoi du numéro de téléphone**
router.post('/register', [registerLimiter, validateRequest(registerValidation)], async (req, res) => {
  try {
    const { firstName, lastName, phone, email, address } = req.validatedBody;

    // Vérifier si le numéro existe déjà
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Ce numéro de téléphone est déjà utilisé',
        code: 'PHONE_EXISTS'
      });
    }

    // Créer l'utilisateur en tant que CLIENT par défaut
    const tempUser = new User({
      firstName,
      lastName,
      phone,
      email,
      role: 'client', // Toujours client à l'inscription
      address,
      pin: Math.random().toString().slice(2, 6).padStart(4, '0'), // PIN temporaire
      accountStatus: 'pending_verification',
      isPhoneVerified: false
    });

    // Générer et envoyer l'OTP SMS
    const otpCode = otpService.generateOTP();
    tempUser.otpCode = otpCode;
    tempUser.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    tempUser.otpAttempts = 0;

    await tempUser.save();

    // Envoyer SMS (ou logger en développement)
    try {
      await otpService.sendOTP(phone, otpCode, 'sms');
      console.log('[AUTH] SMS OTP envoyé:', { phone, otpCode });
    } catch (smsError) {
      console.warn('[AUTH] Impossible d\'envoyer SMS, OTP en console:', otpCode);
      console.warn('[AUTH] Erreur SMS:', smsError.message);
    }

    console.log('[AUTH] Inscription initiée:', { phone, otpCode });

    res.status(201).json({
      success: true,
      message: 'Code de vérification envoyé par SMS',
      data: {
        userId: tempUser._id,
        phone: tempUser.phone,
        nextStep: 'verify_otp',
        // Uniquement en développement
        ...(process.env.NODE_ENV === 'development' && { otpCode })
      }
    });

  } catch (error) {
    console.error('[AUTH] Erreur inscription:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'inscription',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// **ÉTAPE 2: Vérifier l'OTP SMS**
router.post('/verify-otp', [validateRequest(verifyOtpValidation)], async (req, res) => {
  try {
    const { phone, otpCode } = req.validatedBody;

    const user = await User.findOne({ phone, accountStatus: 'pending_verification' });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur introuvable',
        code: 'USER_NOT_FOUND'
      });
    }

    // Vérifier OTP
    if (!user.otpCode || user.otpCode !== otpCode) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();

      return res.status(400).json({
        success: false,
        error: 'Code OTP invalide',
        code: 'INVALID_OTP',
        attemptsLeft: 5 - user.otpAttempts
      });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'Code OTP expiré',
        code: 'OTP_EXPIRED'
      });
    }

    // Marquer le téléphone comme vérifié
    user.isPhoneVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save();

    console.log('[AUTH] Téléphone vérifié:', { phone });

    res.json({
      success: true,
      message: 'Numéro de téléphone vérifié avec succès',
      data: {
        userId: user._id,
        phone: user.phone,
        nextStep: 'set_pin'
      }
    });

  } catch (error) {
    console.error('[AUTH] Erreur vérification OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// **ÉTAPE 3: Définir le code PIN**
router.post('/set-pin', [validateRequest(setPinValidation)], async (req, res) => {
  try {
    const { phone, pin } = req.validatedBody;

    const user = await User.findOne({ phone, isPhoneVerified: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur introuvable ou téléphone non vérifié',
        code: 'USER_NOT_FOUND'
      });
    }

    // Définir le PIN et activer le compte
    user.pin = pin; // Sera hashé par le pre-save hook
    user.accountStatus = 'active';
    await user.save();

    // Générer le token JWT
    const token = jwt.sign(
      {
        userId: user._id,
        phone: user.phone,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('[AUTH] PIN défini et compte activé:', { phone, role: user.role });

    res.json({
      success: true,
      message: 'Inscription terminée avec succès',
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
          vendorInfo: user.vendorInfo
        }
      }
    });

  } catch (error) {
    console.error('[AUTH] Erreur définition PIN:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la définition du PIN',
      code: 'SET_PIN_ERROR'
    });
  }
});

// **CONNEXION: Téléphone + PIN**
router.post('/login', [loginLimiter, validateRequest(loginValidation)], async (req, res) => {
  try {
    const { phone, pin } = req.validatedBody;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Numéro de téléphone ou PIN incorrect',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Vérifier si le compte est verrouillé
    if (user.isPinLocked()) {
      const lockTimeRemaining = Math.ceil((user.pinLockedUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        error: `Compte verrouillé. Réessayez dans ${lockTimeRemaining} minute(s)`,
        code: 'ACCOUNT_LOCKED',
        lockTimeRemaining
      });
    }

    // Vérifier le compte
    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Compte non actif. Veuillez compléter votre inscription.',
        code: 'ACCOUNT_NOT_ACTIVE',
        accountStatus: user.accountStatus
      });
    }

    // Vérifier le PIN
    const isPinValid = await user.comparePin(pin);

    if (!isPinValid) {
      await user.incPinAttempts();
      const attemptsLeft = 5 - (user.pinAttempts + 1);

      return res.status(401).json({
        success: false,
        error: 'Numéro de téléphone ou PIN incorrect',
        code: 'INVALID_CREDENTIALS',
        attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0
      });
    }

    // Connexion réussie
    await user.resetPinAttempts();
    user.lastLogin = Date.now();
    await user.save();

    // Générer token JWT
    const token = jwt.sign(
      {
        userId: user._id,
        phone: user.phone,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('[AUTH] Connexion réussie:', { phone, role: user.role });

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
          vendorInfo: user.vendorInfo,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('[AUTH] Erreur connexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la connexion',
      code: 'LOGIN_ERROR'
    });
  }
});

// **Demander un OTP (pour reset PIN ou renvoi)**
router.post('/request-otp', [otpLimiter, validateRequest(requestOtpValidation)], async (req, res) => {
  try {
    const { phone } = req.validatedBody;

    const user = await User.findOne({ phone });

    if (!user) {
      // Pour des raisons de sécurité, ne pas révéler si le numéro existe
      return res.json({
        success: true,
        message: 'Si ce numéro existe, un code OTP a été envoyé'
      });
    }

    // Vérifier le rate limiting manuel
    if (user.lastOTPRequest && (Date.now() - user.lastOTPRequest.getTime()) < 60000) {
      return res.status(429).json({
        success: false,
        error: 'Veuillez attendre 1 minute avant de demander un nouveau code',
        code: 'OTP_RATE_LIMIT'
      });
    }

    // Générer et envoyer OTP
    const otpCode = otpService.generateOTP();
    user.otpCode = otpCode;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.otpAttempts = 0;
    user.lastOTPRequest = Date.now();
    await user.save();

    await otpService.sendOTP(phone, otpCode, 'sms');

    console.log('[AUTH] OTP envoyé:', { phone, otpCode });

    res.json({
      success: true,
      message: 'Code OTP envoyé par SMS',
      data: {
        phone
      }
    });

  } catch (error) {
    console.error('[AUTH] Erreur envoi OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi du code',
      code: 'OTP_SEND_ERROR'
    });
  }
});

// **Reset PIN après vérification OTP**
router.post('/reset-pin', [validateRequest(setPinValidation)], async (req, res) => {
  try {
    const { phone, pin } = req.validatedBody;
    
    const user = await User.findOne({ phone, isPhoneVerified: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur introuvable',
        code: 'USER_NOT_FOUND'
      });
    }

    // Réinitialiser le PIN
    user.pin = pin;
    user.pinAttempts = 0;
    user.pinLockedUntil = undefined;
    await user.save();

    console.log('[AUTH] PIN réinitialisé:', { phone });

    res.json({
      success: true,
      message: 'PIN réinitialisé avec succès'
    });

  } catch (error) {
    console.error('[AUTH] Erreur reset PIN:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la réinitialisation du PIN',
      code: 'RESET_PIN_ERROR'
    });
  }
});

// **Changer le PIN (utilisateur connecté)**
router.post('/change-pin', [auth, validateRequest(changePinValidation)], async (req, res) => {
  try {
    const { currentPin, newPin } = req.validatedBody;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur introuvable',
        code: 'USER_NOT_FOUND'
      });
    }

    // Vérifier le PIN actuel
    const isPinValid = await user.comparePin(currentPin);

    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        error: 'PIN actuel incorrect',
        code: 'INVALID_CURRENT_PIN'
      });
    }

    // Changer le PIN
    user.pin = newPin;
    await user.save();

    console.log('[AUTH] PIN changé:', { phone: user.phone });

    res.json({
      success: true,
      message: 'PIN changé avec succès'
    });

  } catch (error) {
    console.error('[AUTH] Erreur changement PIN:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du changement de PIN',
      code: 'CHANGE_PIN_ERROR'
    });
  }
});

// **Obtenir le profil de l'utilisateur connecté**
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-pin');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur introuvable',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('[AUTH] Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du profil',
      code: 'PROFILE_ERROR'
    });
  }
});

// **Déconnexion (côté client, invalidation token si implémenté)**
router.post('/logout', auth, async (req, res) => {
  try {
    console.log('[AUTH] Déconnexion:', { userId: req.user.userId });

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('[AUTH] Erreur déconnexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la déconnexion',
      code: 'LOGOUT_ERROR'
    });
  }
});

module.exports = router;
