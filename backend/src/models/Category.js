const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la catégorie est requis'],
    trim: true,
    unique: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  image: {
    type: String,
    default: null
  },
  icon: {
    type: String, // Nom de l'icône (ex: 'fas fa-tshirt')
    default: 'fas fa-tag'
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0, // 0 = catégorie principale, 1 = sous-catégorie, etc.
    min: 0,
    max: 3
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  // Métadonnées pour le SEO
  meta: {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    keywords: [{ type: String, trim: true }]
  },
  // Statistiques
  stats: {
    productCount: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 }
  },
  // Couleurs thématiques (inspirées de la Côte d'Ivoire)
  theme: {
    primaryColor: { type: String, default: '#FF7F00' }, // Orange
    secondaryColor: { type: String, default: '#FFFFFF' }, // Blanc
    accentColor: { type: String, default: '#00B04F' } // Vert
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour optimiser les recherches
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ parent: 1, level: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });

// Virtual pour obtenir les sous-catégories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual pour obtenir les produits de cette catégorie
categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category'
});

// Virtual pour le chemin complet de la catégorie
categorySchema.virtual('fullPath').get(async function() {
  const path = [this.name];
  let current = this;
  
  while (current.parent) {
    current = await this.constructor.findById(current.parent);
    if (current) {
      path.unshift(current.name);
    }
  }
  
  return path.join(' > ');
});

// Middleware pre-save pour générer le slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
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
  }
  next();
});

// Middleware pre-remove pour gérer les sous-catégories orphelines
categorySchema.pre('remove', async function(next) {
  try {
    // Supprimer toutes les sous-catégories
    await this.constructor.deleteMany({ parent: this._id });
    
    // Mettre à jour les produits pour retirer la catégorie
    const Product = mongoose.model('Product');
    await Product.updateMany(
      { category: this._id },
      { $unset: { category: 1 } }
    );
    
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode statique pour obtenir l'arbre des catégories
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true })
    .sort({ level: 1, sortOrder: 1, name: 1 })
    .lean();
  
  const categoryMap = {};
  const tree = [];
  
  // Créer un map des catégories
  categories.forEach(cat => {
    categoryMap[cat._id] = { ...cat, children: [] };
  });
  
  // Construire l'arbre
  categories.forEach(cat => {
    if (cat.parent) {
      if (categoryMap[cat.parent]) {
        categoryMap[cat.parent].children.push(categoryMap[cat._id]);
      }
    } else {
      tree.push(categoryMap[cat._id]);
    }
  });
  
  return tree;
};

// Méthode statique pour obtenir les catégories populaires
categorySchema.statics.getPopularCategories = async function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'stats.productCount': -1, 'stats.totalSales': -1 })
    .limit(limit)
    .lean();
};

// Méthode pour obtenir tous les descendants d'une catégorie
categorySchema.methods.getDescendants = async function() {
  const descendants = [];
  
  const findChildren = async (parentId) => {
    const children = await this.constructor.find({ parent: parentId });
    for (const child of children) {
      descendants.push(child);
      await findChildren(child._id);
    }
  };
  
  await findChildren(this._id);
  return descendants;
};

// Méthode pour mettre à jour les statistiques
categorySchema.methods.updateStats = async function() {
  const Product = mongoose.model('Product');
  const Order = mongoose.model('Order');
  
  // Compter les produits
  const productCount = await Product.countDocuments({ 
    category: this._id,
    status: 'valide'
  });
  
  // TODO: Calculer les ventes totales depuis Order.aggregate
  this.stats.productCount = productCount;
  
  await this.save();
};

module.exports = mongoose.model('Category', categorySchema);