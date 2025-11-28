const mongoose = require('mongoose');

const negotiationSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Le produit est requis']
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le client est requis']
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le vendeur est requis']
  },
  // État de la négociation
  status: {
    type: String,
    enum: {
      values: ['en_cours', 'acceptee', 'refusee', 'expiree', 'annulee'],
      message: 'Le statut doit être en_cours, acceptee, refusee, expiree ou annulee'
    },
    default: 'en_cours'
  },
  // Informations sur les prix
  originalPrice: {
    type: Number,
    required: [true, 'Le prix original est requis']
  },
  proposedPrice: {
    type: Number,
    required: [true, 'Le prix proposé est requis']
  },
  finalPrice: {
    type: Number // Prix final accepté
  },
  savings: {
    type: Number, // Économie réalisée
    default: 0
  },
  savingsPercentage: {
    type: Number, // Pourcentage d'économie
    default: 0
  },
  // Gestion des tentatives
  attempts: {
    type: Number,
    default: 1,
    max: [5, 'Maximum 5 tentatives de négociation']
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  // Historique des messages avec le bot
  messages: [{
    sender: {
      type: String,
      enum: ['customer', 'bot'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    proposedPrice: {
      type: Number // Si le message contient une proposition de prix
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    botResponse: {
      type: String,
      enum: ['accepted', 'rejected', 'counter_offer', 'final_offer']
    }
  }],
  // Métadonnées du bot
  botData: {
    strategy: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate'
    },
    minAcceptablePrice: { type: Number }, // Prix minimum calculé par le bot
    maxDiscount: { type: Number }, // Remise maximum autorisée
    lastCounterOffer: { type: Number }, // Dernière contre-proposition du bot
    responsePatterns: [{ type: String }] // Patterns de réponse utilisés
  },
  // Temporisation et expiration
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h par défaut
    }
  },
  // Résultats et métriques
  result: {
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    reason: { type: String }, // Raison du refus ou de l'acceptation
    customerSatisfaction: { 
      type: Number, 
      min: 1, 
      max: 5 
    }, // Note de satisfaction client (optionnel)
    timeToComplete: { type: Number } // Temps en minutes pour compléter
  },
  // Intégration avec le panier
  addedToCart: {
    type: Boolean,
    default: false
  },
  cartAddedAt: {
    type: Date
  },
  // Métadonnées techniques
  sessionId: {
    type: String, // ID de session pour Socket.IO
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les recherches
negotiationSchema.index({ product: 1, customer: 1 });
negotiationSchema.index({ status: 1, expiresAt: 1 });
negotiationSchema.index({ customer: 1, status: 1 });
negotiationSchema.index({ vendor: 1, status: 1 });
negotiationSchema.index({ sessionId: 1 });

// Virtual pour vérifier si la négociation est active
negotiationSchema.virtual('isActive').get(function() {
  return this.status === 'en_cours' && this.expiresAt > new Date();
});

// Virtual pour calculer les économies
negotiationSchema.virtual('calculatedSavings').get(function() {
  if (this.finalPrice) {
    return this.originalPrice - this.finalPrice;
  }
  return this.originalPrice - this.proposedPrice;
});

// Virtual pour calculer le pourcentage d'économie
negotiationSchema.virtual('calculatedSavingsPercentage').get(function() {
  const savings = this.calculatedSavings;
  return Math.round((savings / this.originalPrice) * 100);
});

// Virtual pour obtenir le dernier message
negotiationSchema.virtual('lastMessage').get(function() {
  return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
});

// Virtual pour calculer le temps écoulé
negotiationSchema.virtual('duration').get(function() {
  const endTime = this.result.acceptedAt || this.result.rejectedAt || new Date();
  return Math.round((endTime - this.createdAt) / (1000 * 60)); // en minutes
});

// Middleware pre-save pour calculer automatiquement les économies
negotiationSchema.pre('save', function(next) {
  if (this.finalPrice) {
    this.savings = this.originalPrice - this.finalPrice;
    this.savingsPercentage = Math.round((this.savings / this.originalPrice) * 100);
  }
  next();
});

// Middleware pour gérer l'expiration automatique
negotiationSchema.pre('save', function(next) {
  if (this.status === 'en_cours' && this.expiresAt <= new Date()) {
    this.status = 'expiree';
    this.result.rejectedAt = new Date();
    this.result.reason = 'Négociation expirée';
  }
  next();
});

// Méthode pour ajouter un message à la conversation
negotiationSchema.methods.addMessage = async function(sender, message, proposedPrice = null, botResponse = null) {
  const newMessage = {
    sender,
    message,
    timestamp: new Date()
  };
  
  // Ajouter les champs optionnels seulement s'ils ont une valeur
  if (proposedPrice !== null && proposedPrice !== undefined) {
    newMessage.proposedPrice = proposedPrice;
  }
  
  if (botResponse !== null && botResponse !== undefined) {
    newMessage.botResponse = botResponse;
  }
  
  this.messages.push(newMessage);
  
  if (sender === 'customer' && proposedPrice) {
    this.proposedPrice = proposedPrice;
    this.attempts += 1;
  }
  
  await this.save();
  return newMessage;
};

// Méthode pour accepter la négociation
negotiationSchema.methods.accept = async function(finalPrice = null) {
  this.status = 'acceptee';
  this.finalPrice = finalPrice || this.proposedPrice;
  this.result.acceptedAt = new Date();
  this.result.reason = 'Prix accepté par le système automatique';
  this.result.timeToComplete = this.duration;
  
  await this.save();
  
  // Ajouter au panier automatiquement (optionnel)
  // await this.addToCart();
};

// Méthode pour refuser la négociation
negotiationSchema.methods.reject = async function(reason = 'Prix trop bas') {
  this.status = 'refusee';
  this.result.rejectedAt = new Date();
  this.result.reason = reason;
  this.result.timeToComplete = this.duration;
  
  await this.save();
};

// Méthode pour proposer un contre-prix
negotiationSchema.methods.counterOffer = async function(counterPrice, botMessage) {
  this.botData.lastCounterOffer = counterPrice;
  
  await this.addMessage('bot', botMessage, counterPrice, 'counter_offer');
  
  // Réinitialiser le timer d'expiration
  this.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes supplémentaires
  
  await this.save();
};

// Méthode pour ajouter au panier après acceptation
negotiationSchema.methods.addToCart = async function() {
  if (this.status !== 'acceptee') {
    throw new Error('La négociation doit être acceptée pour ajouter au panier');
  }
  
  const Cart = mongoose.model('Cart');
  
  // Vérifier si le produit n'est pas déjà dans le panier
  let cart = await Cart.findOne({ user: this.customer });
  
  if (!cart) {
    cart = new Cart({ user: this.customer, items: [] });
  }
  
  const existingItem = cart.items.find(item => 
    item.product.toString() === this.product.toString()
  );
  
  if (existingItem) {
    existingItem.quantity += 1;
    existingItem.negotiatedPrice = this.finalPrice;
  } else {
    cart.items.push({
      product: this.product,
      quantity: 1,
      price: this.finalPrice,
      negotiatedPrice: this.finalPrice,
      negotiationId: this._id
    });
  }
  
  await cart.save();
  
  this.addedToCart = true;
  this.cartAddedAt = new Date();
  await this.save();
  
  return cart;
};

// Méthode statique pour nettoyer les négociations expirées
negotiationSchema.statics.cleanupExpired = async function() {
  const expiredCount = await this.updateMany(
    {
      status: 'en_cours',
      expiresAt: { $lte: new Date() }
    },
    {
      $set: {
        status: 'expiree',
        'result.rejectedAt': new Date(),
        'result.reason': 'Négociation expirée automatiquement'
      }
    }
  );
  
  return expiredCount.modifiedCount;
};

// Méthode statique pour obtenir les statistiques de négociation
negotiationSchema.statics.getStats = async function(filter = {}) {
  const stats = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        accepted: {
          $sum: { $cond: [{ $eq: ['$status', 'acceptee'] }, 1, 0] }
        },
        rejected: {
          $sum: { $cond: [{ $eq: ['$status', 'refusee'] }, 1, 0] }
        },
        expired: {
          $sum: { $cond: [{ $eq: ['$status', 'expiree'] }, 1, 0] }
        },
        avgSavings: {
          $avg: { $cond: [{ $eq: ['$status', 'acceptee'] }, '$savingsPercentage', 0] }
        },
        avgDuration: {
          $avg: '$result.timeToComplete'
        }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    accepted: 0,
    rejected: 0,
    expired: 0,
    avgSavings: 0,
    avgDuration: 0
  };
};

module.exports = mongoose.model('Negotiation', negotiationSchema);