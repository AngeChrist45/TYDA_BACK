const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import des modèles
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Connexion à la base de données
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connecté pour seeding');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
};

// Données de seed
const seedData = {
  users: [
    {
      firstName: 'Admin',
      lastName: 'TYDA',
      email: 'admin@tydavente.com',
      password: 'Admin@123456',
      phone: '+22507000000',
      role: 'admin',
      status: 'actif',
      emailVerified: true
    },
    {
      firstName: 'Kofi',
      lastName: 'Asante',
      email: 'kofi.asante@email.com',
      password: 'Vendeur@123',
      phone: '+22507111111',
      role: 'vendeur',
      status: 'actif',
      emailVerified: true,
      vendorInfo: {
        businessName: 'Boutique Kofi',
        businessDescription: 'Vente de vêtements traditionnels et modernes de qualité',
        validationDate: new Date(),
      },
      address: {
        street: 'Rue des Jardins',
        city: 'Abidjan',
        region: 'Lagunes',
        country: 'Côte d\'Ivoire'
      }
    },
    {
      firstName: 'Aya',
      lastName: 'Traoré',
      email: 'aya.traore@email.com',
      password: 'Vendeur@123',
      phone: '+22507222222',
      role: 'vendeur',
      status: 'actif',
      emailVerified: true,
      vendorInfo: {
        businessName: 'Aya Electronics',
        businessDescription: 'Électronique et accessoires high-tech',
        validationDate: new Date(),
      },
      address: {
        street: 'Avenue Marchand',
        city: 'Abidjan',
        region: 'Lagunes',
        country: 'Côte d\'Ivoire'
      }
    },
    {
      firstName: 'Mamadou',
      lastName: 'Coulibaly',
      email: 'mamadou.coulibaly@email.com',
      password: 'Client@123',
      phone: '+22507333333',
      role: 'client',
      status: 'actif',
      emailVerified: true,
      address: {
        street: 'Quartier Résidentiel',
        city: 'Bouaké',
        region: 'Vallée du Bandama',
        country: 'Côte d\'Ivoire'
      }
    },
    {
      firstName: 'Fatou',
      lastName: 'Diallo',
      email: 'fatou.diallo@email.com',
      password: 'Client@123',
      phone: '+22507444444',
      role: 'client',
      status: 'actif',
      emailVerified: true,
      address: {
        street: 'Rue de la Paix',
        city: 'Yamoussoukro',
        region: 'Lacs',
        country: 'Côte d\'Ivoire'
      }
    },
    // Vendeur en attente
    {
      firstName: 'Ibrahim',
      lastName: 'Ouattara',
      email: 'ibrahim.ouattara@email.com',
      password: 'Vendeur@123',
      phone: '+22507555555',
      role: 'vendeur',
      status: 'en_attente',
      emailVerified: true,
      vendorInfo: {
        businessName: 'Ibrahim Marketplace',
        businessDescription: 'Commerce général et produits locaux'
      }
    }
  ],

  categories: [
    {
      name: 'Mode & Vêtements',
      description: 'Vêtements, chaussures et accessoires de mode',
      icon: 'fas fa-tshirt',
      theme: {
        primaryColor: '#FF7F00',
        secondaryColor: '#FFFFFF',
        accentColor: '#00B04F'
      },
      level: 0,
      sortOrder: 1
    },
    {
      name: 'Électronique',
      description: 'Smartphones, ordinateurs et accessoires high-tech',
      icon: 'fas fa-laptop',
      theme: {
        primaryColor: '#FF7F00',
        secondaryColor: '#FFFFFF',
        accentColor: '#00B04F'
      },
      level: 0,
      sortOrder: 2
    },
    {
      name: 'Maison & Jardin',
      description: 'Mobilier, décoration et outils de jardin',
      icon: 'fas fa-home',
      theme: {
        primaryColor: '#FF7F00',
        secondaryColor: '#FFFFFF',
        accentColor: '#00B04F'
      },
      level: 0,
      sortOrder: 3
    },
    {
      name: 'Sports & Loisirs',
      description: 'Équipements sportifs et articles de loisirs',
      icon: 'fas fa-football-ball',
      theme: {
        primaryColor: '#FF7F00',
        secondaryColor: '#FFFFFF',
        accentColor: '#00B04F'
      },
      level: 0,
      sortOrder: 4
    },
    {
      name: 'Alimentation',
      description: 'Produits alimentaires et boissons',
      icon: 'fas fa-apple-alt',
      theme: {
        primaryColor: '#FF7F00',
        secondaryColor: '#FFFFFF',
        accentColor: '#00B04F'
      },
      level: 0,
      sortOrder: 5
    }
  ],

  // Sous-catégories (seront ajoutées après la création des catégories principales)
  subcategories: [
    {
      parentName: 'Mode & Vêtements',
      categories: [
        { name: 'Vêtements Hommes', description: 'Mode masculine', icon: 'fas fa-male' },
        { name: 'Vêtements Femmes', description: 'Mode féminine', icon: 'fas fa-female' },
        { name: 'Chaussures', description: 'Chaussures pour tous', icon: 'fas fa-shoe-prints' },
        { name: 'Accessoires', description: 'Sacs, montres, bijoux', icon: 'fas fa-gem' }
      ]
    },
    {
      parentName: 'Électronique',
      categories: [
        { name: 'Smartphones', description: 'Téléphones portables', icon: 'fas fa-mobile-alt' },
        { name: 'Ordinateurs', description: 'PC et laptops', icon: 'fas fa-desktop' },
        { name: 'Accessoires Tech', description: 'Câbles, écouteurs...', icon: 'fas fa-headphones' }
      ]
    }
  ]
};

// Produits exemples
const getProductsData = (users, categories) => {
  const vendor1 = users.find(u => u.email === 'kofi.asante@email.com');
  const vendor2 = users.find(u => u.email === 'aya.traore@email.com');
  const modeCategory = categories.find(c => c.name === 'Mode & Vêtements');
  const electronicsCategory = categories.find(c => c.name === 'Électronique');
  const maisonCategory = categories.find(c => c.name === 'Maison & Jardin');

  return [
    {
      title: 'Boubou Traditionnel Ivoirien',
      description: 'Magnifique boubou traditionnel en coton wax authentique, confectionné par des artisans locaux. Parfait pour les cérémonies et événements spéciaux.',
      price: 45000,
      vendor: vendor1._id,
      category: modeCategory._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1583743814966-8936f37f3a3e?w=600&h=400&fit=crop',
          alt: 'Boubou traditionnel',
          isPrimary: true
        }
      ],
      specifications: {
        brand: 'Artisanat Local',
        material: 'Coton Wax',
        origin: 'Côte d\'Ivoire',
        size: 'L'
      },
      inventory: { quantity: 15 },
      tags: ['traditionnel', 'boubou', 'wax', 'ivoirien'],
      featured: true,
      status: 'valide'
    },
    {
      title: 'Smartphone Android 128GB',
      description: 'Smartphone dernière génération avec écran AMOLED 6.5", 128GB de stockage, double caméra et batterie longue durée.',
      price: 120000,
      vendor: vendor2._id,
      category: electronicsCategory._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=400&fit=crop',
          alt: 'Smartphone Android',
          isPrimary: true
        }
      ],
      specifications: {
        brand: 'TechMobile',
        storage: '128GB',
        ram: '6GB',
        screenSize: '6.5 pouces',
        color: 'Noir'
      },
      inventory: { quantity: 25 },
      tags: ['smartphone', 'android', 'tech'],
      featured: true,
      status: 'valide',
      negotiation: {
        enabled: true,
        percentage: 10
      }
    },
    {
      title: 'Ensemble de Cuisine Moderne',
      description: 'Set complet d\'ustensiles de cuisine en inox de haute qualité. Comprend casseroles, poêles et accessoires.',
      price: 85000,
      vendor: vendor1._id,
      category: maisonCategory._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
          alt: 'Ensemble cuisine',
          isPrimary: true
        }
      ],
      specifications: {
        brand: 'KitchenPro',
        material: 'Inox',
        pieces: '12 pièces'
      },
      inventory: { quantity: 12 },
      tags: ['cuisine', 'ustensiles', 'inox'],
      status: 'valide',
      negotiation: {
        enabled: true,
        percentage: 15
      }
    },
    {
      title: 'Robe Moderne Africaine',
      description: 'Élégante robe moderne avec motifs africains, parfaite pour le bureau ou les sorties.',
      price: 28000,
      vendor: vendor1._id,
      category: modeCategory._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=400&fit=crop',
          alt: 'Robe africaine moderne',
          isPrimary: true
        }
      ],
      specifications: {
        brand: 'African Style',
        material: 'Coton',
        size: 'M',
        color: 'Multicolore'
      },
      inventory: { quantity: 20 },
      tags: ['robe', 'africaine', 'moderne', 'femme'],
      featured: true,
      status: 'valide'
    },
    {
      title: 'Écouteurs Bluetooth Sans Fil',
      description: 'Écouteurs Bluetooth haute qualité avec réduction de bruit et autonomie de 8 heures.',
      price: 35000,
      vendor: vendor2._id,
      category: electronicsCategory._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=400&fit=crop',
          alt: 'Écouteurs Bluetooth',
          isPrimary: true
        }
      ],
      specifications: {
        brand: 'AudioTech',
        connectivity: 'Bluetooth 5.0',
        battery: '8 heures',
        color: 'Blanc'
      },
      inventory: { quantity: 30 },
      tags: ['écouteurs', 'bluetooth', 'sans-fil'],
      status: 'valide'
    },
    // Produit en attente de validation
    {
      title: 'Sac à Main Cuir Artisanal',
      description: 'Sac à main en cuir véritable, confectionné à la main par des artisans ivoiriens.',
      price: 65000,
      vendor: vendor1._id,
      category: modeCategory._id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=400&fit=crop',
          alt: 'Sac à main cuir',
          isPrimary: true
        }
      ],
      specifications: {
        brand: 'Artisanat Local',
        material: 'Cuir véritable',
        color: 'Marron',
        size: 'Moyen'
      },
      inventory: { quantity: 8 },
      tags: ['sac', 'cuir', 'artisanal', 'femme'],
      status: 'en_attente'
    }
  ];
};

// Fonction principale de seeding
const seedDatabase = async () => {
  try {
    console.log('🚀 Début du seeding de la base de données...');

    // Supprimer les données existantes
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️  Données existantes supprimées');

    // Créer les utilisateurs
    console.log('👥 Création des utilisateurs...');
    const hashedUsers = await Promise.all(
      seedData.users.map(async (user) => {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return { ...user, password: hashedPassword };
      })
    );

    const users = await User.insertMany(hashedUsers);
    console.log(`✅ ${users.length} utilisateurs créés`);

    // Assigner l'admin comme validateur des vendeurs actifs
    const admin = users.find(u => u.role === 'admin');
    for (const user of users) {
      if (user.role === 'vendeur' && user.status === 'actif') {
        user.vendorInfo.validatedBy = admin._id;
        await user.save();
      }
    }

    // Créer les catégories principales
    console.log('🏷️  Création des catégories...');
    const categories = await Category.insertMany(seedData.categories);
    console.log(`✅ ${categories.length} catégories principales créées`);

    // Créer les sous-catégories
    console.log('🏷️  Création des sous-catégories...');
    let subcategoryCount = 0;
    for (const subCatGroup of seedData.subcategories) {
      const parentCategory = categories.find(c => c.name === subCatGroup.parentName);
      if (parentCategory) {
        for (const subCat of subCatGroup.categories) {
          const subcategory = new Category({
            ...subCat,
            parent: parentCategory._id,
            level: 1,
            theme: parentCategory.theme
          });
          await subcategory.save();
          subcategoryCount++;
        }
      }
    }
    console.log(`✅ ${subcategoryCount} sous-catégories créées`);

    // Récupérer toutes les catégories pour les produits
    const allCategories = await Category.find({});

    // Créer les produits
    console.log('📦 Création des produits...');
    const productsData = getProductsData(users, allCategories);
    
    // Assigner l'admin comme validateur des produits validés
    const productsWithValidation = productsData.map(product => {
      if (product.status === 'valide') {
        product.validation = {
          validatedBy: admin._id,
          validatedAt: new Date(),
          adminNotes: 'Produit validé lors du seeding'
        };
        
        // Calculer le prix minimum pour la négociation
        if (product.negotiation?.enabled) {
          const minPrice = Math.round(product.price * (1 - product.negotiation.percentage / 100));
          product.negotiation.minPrice = minPrice;
          product.negotiation.enabledBy = admin._id;
          product.negotiation.enabledAt = new Date();
        }
      }
      return product;
    });

    const products = await Product.insertMany(productsWithValidation);
    console.log(`✅ ${products.length} produits créés`);

    // Mettre à jour les statistiques des catégories
    console.log('📊 Mise à jour des statistiques...');
    for (const category of allCategories) {
      await category.updateStats();
    }

    console.log('✅ Seeding terminé avec succès !');
    console.log('\n🎯 Informations de connexion:');
    console.log('👨‍💼 Admin: admin@tydavente.com / Admin@123456');
    console.log('🏪 Vendeur 1: kofi.asante@email.com / Vendeur@123');
    console.log('🏪 Vendeur 2: aya.traore@email.com / Vendeur@123');
    console.log('👤 Client 1: mamadou.coulibaly@email.com / Client@123');
    console.log('👤 Client 2: fatou.diallo@email.com / Client@123');
    console.log('⏳ Vendeur en attente: ibrahim.ouattara@email.com / Vendeur@123');

    console.log('\n📊 Résumé:');
    console.log(`- ${users.length} utilisateurs`);
    console.log(`- ${allCategories.length} catégories`);
    console.log(`- ${products.length} produits`);
    console.log(`- ${products.filter(p => p.status === 'valide').length} produits validés`);
    console.log(`- ${products.filter(p => p.negotiation?.enabled).length} produits négociables`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Fonction pour nettoyer la base de données
const cleanDatabase = async () => {
  try {
    console.log('🧹 Nettoyage de la base de données...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('✅ Base de données nettoyée');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Exécution selon l'argument de ligne de commande
const main = async () => {
  await connectDB();

  const command = process.argv[2];

  switch (command) {
    case 'clean':
      await cleanDatabase();
      break;
    case 'seed':
    default:
      await seedDatabase();
      break;
  }
};

// Exécuter si ce fichier est appelé directement
if (require.main === module) {
  main();
}

module.exports = { seedDatabase, cleanDatabase };