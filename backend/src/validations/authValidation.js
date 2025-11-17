const Joi = require('joi');

// Validation pour l'inscription (étape 1: téléphone)
const registerValidation = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .required()
    .messages({
      'string.empty': 'Le prénom est requis',
      'string.min': 'Le prénom doit contenir au moins 2 caractères',
      'string.max': 'Le prénom ne peut pas dépasser 50 caractères',
      'string.pattern.base': 'Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets'
    }),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .required()
    .messages({
      'string.empty': 'Le nom est requis',
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères',
      'string.pattern.base': 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'
    }),

  phone: Joi.string()
    .pattern(/^\+225[0-9]{8,10}$/)
    .required()
    .messages({
      'string.empty': 'Le numéro de téléphone est requis',
      'string.pattern.base': 'Format de téléphone invalide (utilisez +225XXXXXXXX avec 8 à 10 chiffres)'
    }),

  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .optional()
    .messages({
      'string.email': 'Format d\'email invalide'
    }),

  address: Joi.string()
    .trim()
    .max(200)
    .optional()
    .messages({
      'string.max': 'L\'adresse ne peut pas dépasser 200 caractères'
    })
}).options({ stripUnknown: true });

// Validation pour vérification OTP (étape 2)
const verifyOtpValidation = Joi.object({
  phone: Joi.string()
    .pattern(/^\+225[0-9]{8,10}$/)
    .required()
    .messages({
      'string.empty': 'Le numéro de téléphone est requis',
      'string.pattern.base': 'Format de téléphone invalide'
    }),

  otpCode: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.empty': 'Le code OTP est requis',
      'string.length': 'Le code doit contenir exactement 6 chiffres',
      'string.pattern.base': 'Le code ne peut contenir que des chiffres'
    })
}).options({ stripUnknown: true });

// Validation pour définir le PIN (étape 3)
const setPinValidation = Joi.object({
  phone: Joi.string()
    .pattern(/^\+225[0-9]{8,10}$/)
    .required()
    .messages({
      'string.empty': 'Le numéro de téléphone est requis',
      'string.pattern.base': 'Format de téléphone invalide'
    }),

  pin: Joi.string()
    .length(4)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.empty': 'Le code PIN est requis',
      'string.length': 'Le PIN doit contenir exactement 4 chiffres',
      'string.pattern.base': 'Le PIN ne peut contenir que des chiffres'
    }),

  confirmPin: Joi.string()
    .valid(Joi.ref('pin'))
    .required()
    .messages({
      'any.only': 'La confirmation du PIN ne correspond pas',
      'string.empty': 'La confirmation du PIN est requise'
    })
}).options({ stripUnknown: true });

// Validation pour la connexion (téléphone + PIN)
const loginValidation = Joi.object({
  phone: Joi.string()
    .pattern(/^\+225[0-9]{8,10}$/)
    .required()
    .messages({
      'string.empty': 'Le numéro de téléphone est requis',
      'string.pattern.base': 'Format de téléphone invalide'
    }),

  pin: Joi.string()
    .length(4)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.empty': 'Le code PIN est requis',
      'string.length': 'Le PIN doit contenir exactement 4 chiffres',
      'string.pattern.base': 'Le PIN ne peut contenir que des chiffres'
    })
}).options({ stripUnknown: true });

// Validation pour demande OTP (reset PIN ou renvoi)
const requestOtpValidation = Joi.object({
  phone: Joi.string()
    .pattern(/^\+225[0-9]{8,10}$/)
    .required()
    .messages({
      'string.empty': 'Le numéro de téléphone est requis',
      'string.pattern.base': 'Format de téléphone invalide'
    })
}).options({ stripUnknown: true });

// Validation pour changement de PIN
const changePinValidation = Joi.object({
  currentPin: Joi.string()
    .length(4)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.empty': 'Le PIN actuel est requis',
      'string.length': 'Le PIN doit contenir exactement 4 chiffres',
      'string.pattern.base': 'Le PIN ne peut contenir que des chiffres'
    }),

  newPin: Joi.string()
    .length(4)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.empty': 'Le nouveau PIN est requis',
      'string.length': 'Le nouveau PIN doit contenir exactement 4 chiffres',
      'string.pattern.base': 'Le nouveau PIN ne peut contenir que des chiffres'
    }),

  confirmNewPin: Joi.string()
    .valid(Joi.ref('newPin'))
    .required()
    .messages({
      'any.only': 'La confirmation du nouveau PIN ne correspond pas',
      'string.empty': 'La confirmation du nouveau PIN est requise'
    })
}).options({ stripUnknown: true });

// Validation pour vérification de téléphone
const phoneVerificationValidation = Joi.object({
  phone: Joi.string()
    .pattern(/^\+225[0-9]{8,10}$/)
    .required()
    .messages({
      'string.empty': 'Le numéro de téléphone est requis',
      'string.pattern.base': 'Format de téléphone invalide (utilisez +225XXXXXXXX)'
    }),

  code: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.empty': 'Le code de vérification est requis',
      'string.length': 'Le code doit contenir exactement 6 chiffres',
      'string.pattern.base': 'Le code ne peut contenir que des chiffres'
    })
}).options({ stripUnknown: true });

// Validation pour demande statut vendeur
const requestVendorStatusValidation = Joi.object({
  businessName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Le nom de l\'entreprise est requis',
      'string.min': 'Le nom de l\'entreprise doit contenir au moins 2 caractères',
      'string.max': 'Le nom de l\'entreprise ne peut pas dépasser 100 caractères'
    }),

  description: Joi.string()
    .trim()
    .min(20)
    .max(500)
    .required()
    .messages({
      'string.empty': 'La description de votre activité est requise',
      'string.min': 'La description doit contenir au moins 20 caractères',
      'string.max': 'La description ne peut pas dépasser 500 caractères'
    }),

  category: Joi.string()
    .valid('alimentation', 'vetements', 'electronique', 'maison', 'services', 'autres')
    .default('autres')
    .messages({
      'any.only': 'Catégorie invalide'
    })
}).options({ stripUnknown: true });

module.exports = {
  registerValidation,
  verifyOtpValidation,
  setPinValidation,
  loginValidation,
  requestOtpValidation,
  changePinValidation,
  phoneVerificationValidation,
  requestVendorStatusValidation
};