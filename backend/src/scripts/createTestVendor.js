const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createTestVendor = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Données du vendeur test
    const vendorData = {
      firstName: 'Jean',
      lastName: 'Vendeur',
      phone: '+2250123456789',
      pin: '1234', // PIN de test
      role: 'vendeur',
      accountStatus: 'active',
      isPhoneVerified: true,
      address: 'Cocody, Abidjan',
      vendorInfo: {
        businessName: 'Boutique Jean',
        description: 'Vente de produits électroniques et accessoires',
        validationStatus: 'approved',
        validatedAt: new Date()
      }
    };

    // Vérifier si l'utilisateur existe déjà
    const existingVendor = await User.findOne({ phone: vendorData.phone });
    if (existingVendor) {
      console.log('⚠️ Un vendeur avec ce téléphone existe déjà');
      console.log(`   Statut actuel: ${existingVendor.accountStatus}`);
      return;
    }

    // Créer le vendeur
    const vendor = new User(vendorData);
    await vendor.save();

    console.log('✅ Vendeur test créé avec succès:');
    console.log(`   👤 Nom: ${vendor.firstName} ${vendor.lastName}`);
    console.log(`   📱 Téléphone: ${vendor.phone}`);
    console.log(`   🔐 PIN: 1234`);
    console.log(`   👔 Rôle: ${vendor.role}`);
    console.log(`   📊 Statut: ${vendor.accountStatus}`);
    console.log(`   🏢 Entreprise: ${vendor.vendorInfo.businessName}`);
    console.log(`   ✅ Validation: ${vendor.vendorInfo.validationStatus}`);

    // Vérifier tous les utilisateurs maintenant
    const allUsers = await User.find({}, 'firstName lastName phone role accountStatus createdAt');
    console.log(`\n📋 Total utilisateurs: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} - ${user.role} [${user.accountStatus}]`);
    });

    // Compter par statut
    const pendingVendors = await User.countDocuments({ role: 'vendeur', 'vendorInfo.validationStatus': 'pending' });
    const activeUsers = await User.countDocuments({ accountStatus: 'active' });
    
    console.log(`\n📊 Statistiques:`);
    console.log(`   🟡 Vendeurs en attente: ${pendingVendors}`);
    console.log(`   🟢 Utilisateurs actifs: ${activeUsers}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
};

createTestVendor();