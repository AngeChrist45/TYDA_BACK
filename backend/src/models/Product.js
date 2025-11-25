const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre du produit est requis'],
    trim: true,
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true,
    maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  // Informations prix et négociation
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  originalPrice: {
    type: Number, // Prix avant négociation/promotion
    default: function() { return this.price; }
  },
  negotiation: {
    enabled: { type: Boolean, default: false },
    percentage: { type: Number, min: 0, max: 50 }, // % max de négociation (secret)
    minPrice: { type: Number }, // Prix minimum calculé
    enabledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin qui a activé
    enabledAt: { type: Date }
  },
  // Informations vendeur et catégorie
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le vendeur est requis']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La catégorie est requise']
  },
  // Images et médias
  images: [{
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false }
  }],
  // Gestion des stocks
  inventory: {
    quantity: { type: Number, required: true, min: 0 },
    reserved: { type: Number, default: 0 }, // Quantité réservée dans les paniers
    lowStockThreshold: { type: Number, default: 5 },
    trackInventory: { type: Boolean, default: true }
  },
  // Spécifications et attributs
  specifications: {
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    color: { type: String, trim: true },
    size: { type: String, trim: true },
    weight: { type: Number }, // en grammes
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      unit: { type: String, default: 'cm' }
    }
  },
  // Attributs personnalisés (flexibilité)
  customAttributes: [{
    name: { type: String, required: true },
    value: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'boolean', 'date'], default: 'text' }
  }],
  // États et validation
  status: {
    type: String,
    enum: {
      values: ['en_attente', 'valide', 'refuse', 'suspendu', 'archive'],
      message: 'Le statut doit être en_attente, valide, refuse, suspendu ou archive'
    },
    default: 'en_attente'
  },
  validation: {
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    validatedAt: { type: Date },
    rejectionReason: { type: String },
    adminNotes: { type: String }
  },
  // SEO et recherche
  seo: {
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    keywords: [{ type: String, trim: true }]
  },
  // Statistiques et performances
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    negotiationRequests: { type: Number, default: 0 },
    successfulNegotiations: { type: Number, default: 0 }
  },
  // Paramètres d'affichage
  featured: { type: Boolean, default: false },
  isPromoted: { type: Boolean, default: false },
  promotionEndDate: { type: Date },
  tags: [{ type: String, trim: true }],
  // Livraison et logistique
  shipping: {
    freeShipping: { type: Boolean, default: false },
    shippingCost: { type: Number, default: 0 },
    shippingTime: { type: String }, // ex: "2-3 jours"
    availableRegions: [{ type: String }] // Régions de livraison
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les recherches
productSchema.index({ title: 'text', description: 'text', 'specifications.brand': 'text' });
productSchema.index({ vendor: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ status: 1, featured: 1, createdAt: -1 });
productSchema.index({ 'stats.views': -1 });
productSchema.index({ 'stats.totalSales': -1 });
productSchema.index({ slug: 1 });

// Virtual pour vérifier si le produit est en stock
productSchema.virtual('inStock').get(function() {
  return this.inventory.quantity > this.inventory.reserved;
});

// Virtual pour vérifier si le produit est éligible à la négociation
productSchema.virtual('isNegotiable').get(function() {
  const minAmount = process.env.MIN_NEGOTIATION_AMOUNT || 5000;
  return this.price >= minAmount && 
         this.negotiation.enabled && 
         this.status === 'valide';
});

// Virtual pour calculer le prix minimum de négociation
productSchema.virtual('minNegotiationPrice').get(function() {
  if (!this.negotiation.enabled || !this.negotiation.percentage) {
    return this.price;
  }
  return Math.round(this.price * (1 - this.negotiation.percentage / 100));
});

// Virtual pour l'URL principale de l'image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images[0] ? this.images[0].url : null);
});

// Middleware pre-save pour générer le slug
productSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('title')) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    this.slug = `${baseSlug}-${Date.now()}`;
  }
  
  // Calculer le prix minimum si la négociation est activée
  if (this.negotiation.enabled && this.negotiation.percentage) {
    this.negotiation.minPrice = this.minNegotiationPrice;
  }
  
  next();
});

// Middleware pre-save pour valider les images
productSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    // S'assurer qu'il n'y a qu'une seule image principale
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryImages.length > 1) {
      this.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    }
  }
  next();
});

// Méthode pour incrémenter les vues
productSchema.methods.incrementViews = async function() {
  this.stats.views += 1;
  await this.save();
};

// Méthode pour activer la négociation (admin seulement)
productSchema.methods.enableNegotiation = async function(percentage, adminId) {
  const minAmount = process.env.MIN_NEGOTIATION_AMOUNT || 5000;
  
  if (this.price < minAmount) {
    throw new Error(`Le prix doit être d'au moins ${minAmount} FCFA pour activer la négociation`);
  }
  
  if (percentage < 1 || percentage > 50) {
    throw new Error('Le pourcentage de négociation doit être entre 1% et 50%');
  }
  
  this.negotiation.enabled = true;
  this.negotiation.percentage = percentage;
  this.negotiation.minPrice = Math.round(this.price * (1 - percentage / 100));
  this.negotiation.enabledBy = adminId;
  this.negotiation.enabledAt = new Date();
  
  await this.save();
};

// Méthode pour désactiver la négociation
productSchema.methods.disableNegotiation = async function() {
  this.negotiation.enabled = false;
  this.negotiation.percentage = undefined;
  this.negotiation.minPrice = undefined;
  
  await this.save();
};

// Méthode pour vérifier si un prix négocié est acceptable
productSchema.methods.isNegotiatedPriceValid = function(proposedPrice) {
  if (!this.isNegotiable) return false;
  
  const minPrice = this.minNegotiationPrice;
  return proposedPrice >= minPrice && proposedPrice < this.price;
};

// Méthode pour réserver du stock
productSchema.methods.reserveStock = async function(quantity) {
  if (this.inventory.quantity - this.inventory.reserved < quantity) {
    throw new Error('Stock insuffisant');
  }
  
  this.inventory.reserved += quantity;
  await this.save();
};

// Méthode pour libérer du stock réservé
productSchema.methods.releaseStock = async function(quantity) {
  this.inventory.reserved = Math.max(0, this.inventory.reserved - quantity);
  await this.save();
};

// Méthode pour confirmer une vente
productSchema.methods.confirmSale = async function(quantity) {
  if (this.inventory.quantity < quantity) {
    throw new Error('Stock insuffisant pour confirmer la vente');
  }
  
  this.inventory.quantity -= quantity;
  this.inventory.reserved = Math.max(0, this.inventory.reserved - quantity);
  this.stats.totalSales += quantity;
  
  await this.save();
};

// Méthode statique pour rechercher des produits
productSchema.statics.searchProducts = function(searchQuery, options = {}) {
  const {
    category,
    minPrice,
    maxPrice,
    vendor,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = options;
  
  let query = { status: 'valide' };
  
  // Recherche textuelle
  if (searchQuery) {
    query.$text = { $search: searchQuery };
  }
  
  // Filtres
  if (category) query.category = category;
  if (vendor) query.vendor = vendor;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = minPrice;
    if (maxPrice) query.price.$lte = maxPrice;
  }
  
  // Tri
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  // Pagination
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('vendor', 'firstName lastName vendorInfo.businessName')
    .populate('category', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Product', productSchema);