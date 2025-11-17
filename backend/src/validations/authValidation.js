const Joi = require('joi');

// Validation pour l'inscription
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

  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'L\'email est requis',
      'string.email': 'Format d\'email invalide'
    }),

  password: Joi.string()
    .min(6)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Le mot de passe est requis',
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
      'string.max': 'Le mot de passe ne peut pas dépasser 128 caractères',
      'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'La confirmation du mot de passe ne correspond pas',
      'string.empty': 'La confirmation du mot de passe est requise'
    }),

  phone: Joi.string()
    .pattern(/^\+225[0-9]{8,10}$/)
    .required()
    .messages({
      'string.empty': 'Le numéro de téléphone est requis',
      'string.pattern.base': 'Format de téléphone invalide (utilisez +225XXXXXXXX avec 8 à 10 chiffres)'
    }),

  role: Joi.string()
    .valid('client', 'vendeur')
    .default('client')
    .messages({
      'any.only': 'Le rôle doit être client ou vendeur'
    }),

  address: Joi.object({
    street: Joi.string().trim().max(200).optional(),
    city: Joi.string().trim().max(100).optional(),
    region: Joi.string().trim().max(100).optional(),
    country: Joi.string().trim().default('Côte d\'Ivoire')
  }).optional(),

  vendorInfo: Joi.object({
    businessName: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .optional() // Rendu optionnel pour l'inscription
      .messages({
        'string.empty': 'Le nom de l\'entreprise est requis pour les vendeurs',
        'string.min': 'Le nom de l\'entreprise doit contenir au moins 2 caractères',
        'string.max': 'Le nom de l\'entreprise ne peut pas dépasser 100 caractères'
      }),

    businessDescription: Joi.string()
      .trim()
      .max(500)
      .optional()
      .messages({
        'string.max': 'La description ne peut pas dépasser 500 caractères'
      }),

    businessLicense: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'L\'URL du document de licence doit être valide'
      })
  }).when('role', {
    is: 'vendeur',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
}).options({ stripUnknown: true });

// Validation pour la connexion
const loginValidation = Joi.object({
  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'L\'email est requis',
      'string.email': 'Format d\'email invalide'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Le mot de passe est requis'
    }),

  rememberMe: Joi.boolean()
    .default(false)
    .optional()
}).options({ stripUnknown: true });

// Validation pour mot de passe oublié
const forgotPasswordValidation = Joi.object({
  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'L\'email est requis',
      'string.email': 'Format d\'email invalide'
    })
}).options({ stripUnknown: true });

// Validation pour réinitialisation du mot de passe
const resetPasswordValidation = Joi.object({
  password: Joi.string()
    .min(6)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Le mot de passe est requis',
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
      'string.max': 'Le mot de passe ne peut pas dépasser 128 caractères',
      'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'La confirmation du mot de passe ne correspond pas',
      'string.empty': 'La confirmation du mot de passe est requise'
    })
}).options({ stripUnknown: true });

// Validation pour changement de mot de passe
const changePasswordValidation = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Le mot de passe actuel est requis'
    }),

  newPassword: Joi.string()
    .min(6)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Le nouveau mot de passe est requis',
      'string.min': 'Le nouveau mot de passe doit contenir au moins 6 caractères',
      'string.max': 'Le nouveau mot de passe ne peut pas dépasser 128 caractères',
      'string.pattern.base': 'Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    }),

  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'La confirmation du nouveau mot de passe ne correspond pas',
      'string.empty': 'La confirmation du nouveau mot de passe est requise'
    })
}).options({ stripUnknown: true });

// Validation pour vérification d'email
const emailVerificationValidation = Joi.object({
  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'L\'email est requis',
      'string.email': 'Format d\'email invalide'
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

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  emailVerificationValidation,
  phoneVerificationValidation
};