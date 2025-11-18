const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const createNegotiableProduct = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté\n');

    // 1. Créer ou trouver un vendeur
    let vendor = await User.findOne({ role: 'vendeur' });
    
    if (!vendor) {
      console.log('📝 Création d\'un vendeur...');
      const hashedPin = await bcrypt.hash('1234', 12);
      vendor = await User.create({
        firstName: 'Vendeur',
        lastName: 'Test',
        phone: '+2250700000001',
        pin: hashedPin,
        role: 'vendeur',
        accountStatus: 'active',
        isPhoneVerified: true,
        vendorInfo: {
          businessName: 'Boutique Test',
          description: 'Magasin de test pour négociations',
          validationStatus: 'approved',
          validatedAt: new Date()
        }
      });
      console.log('✅ Vendeur créé:', vendor.phone);
    } else {
      console.log('✅ Vendeur trouvé:', vendor.phone);
    }

    // 2. Créer ou trouver une catégorie
    let category = await Category.findOne();
    
    if (!category) {
      console.log('📝 Création d\'une catégorie...');
      category = await Category.create({
        name: 'Électronique',
        slug: 'electronique',
        description: 'Appareils et accessoires électroniques',
        isActive: true
      });
      console.log('✅ Catégorie créée:', category.name);
    } else {
      console.log('✅ Catégorie trouvée:', category.name);
    }

    // 3. Créer un produit négociable
    console.log('\n📝 Création d\'un produit négociable...');
    
    const product = await Product.create({
      title: 'iPhone 13 Pro Max - 256GB',
      slug: 'iphone-13-pro-max-256gb-' + Date.now(),
      description: 'iPhone 13 Pro Max en excellent état, 256GB de stockage. Batterie à 95%. Livré avec boîte et accessoires d\'origine.',
      price: 450000, // 450,000 FCFA
      category: category._id,
      vendor: vendor._id,
      
      // Images avec structure d'objet
      images: [
        {
          url: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800',
          alt: 'iPhone 13 Pro Max face avant',
          isPrimary: true
        },
        {
          url: 'https://images.unsplash.com/photo-1632633707049-e86ffbf40a1e?w=800',
          alt: 'iPhone 13 Pro Max face arrière',
          isPrimary: false
        }
      ],
      
      // Inventaire
      inventory: {
        quantity: 3,
        reserved: 0,
        lowStockThreshold: 1,
        trackInventory: true
      },
      
      status: 'valide',
      
      // Configuration de la négociation
      negotiation: {
        enabled: true,
        percentage: 15, // 15% de remise max
        minPrice: 450000 * 0.85 // 382,500 FCFA
      },
      
      // Informations additionnelles
      specifications: {
        brand: 'Apple',
        model: 'iPhone 13 Pro Max',
        color: 'Bleu Alpin'
      },
      
      customAttributes: [
        { name: 'Stockage', value: '256GB', type: 'text' },
        { name: 'État', value: 'Excellent', type: 'text' },
        { name: 'Batterie', value: '95%', type: 'text' }
      ],
      
      shipping: {
        freeShipping: false,
        shippingCost: 2000,
        shippingTime: '1-2 jours',
        availableRegions: ['Abidjan', 'Bouaké', 'Yamoussoukro']
      }
    });

    await product.save();

    console.log('\n✅ Produit négociable créé avec succès!\n');
    console.log('📱 Détails du produit:');
    console.log('   ID:', product._id);
    console.log('   Titre:', product.title);
    console.log('   Prix original:', product.price.toLocaleString(), 'FCFA');
    console.log('   Prix minimum:', product.minNegotiationPrice.toLocaleString(), 'FCFA');
    console.log('   Remise max:', product.negotiation.percentage + '%');
    console.log('   Négociable:', product.isNegotiable ? 'OUI ✅' : 'NON ❌');
    console.log('   Vendeur:', vendor.firstName, vendor.lastName);
    console.log('   Catégorie:', category.name);

    console.log('\n🧪 Pour tester la négociation:');
    console.log('POST https://tyda-back.onrender.com/api/negotiations/start');
    console.log('Headers: Authorization: Bearer <votre_token>');
    console.log('Body:', JSON.stringify({
      productId: product._id.toString(),
      sessionId: 'test_session_' + Date.now()
    }, null, 2));

    console.log('\n💡 Fourchette de prix acceptables:');
    console.log('   Prix original: 450,000 FCFA');
    console.log('   Prix minimum:  ' + product.minNegotiationPrice.toLocaleString() + ' FCFA (remise de 15%)');
    console.log('   Essayez de proposer entre 380,000 et 440,000 FCFA');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

createNegotiableProduct();
