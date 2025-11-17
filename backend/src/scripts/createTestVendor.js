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
      email: 'vendeur.test@tyda-vente.ci',
      password: await bcrypt.hash('Vendeur123', 12),
      phone: '+2250123456789',
      role: 'vendeur',
      address: {
        street: '123 Rue du Commerce',
        city: 'Abidjan',
        region: 'Cocody',
        country: 'Côte d\'Ivoire'
      },
      vendorInfo: {
        businessName: 'Boutique Jean',
        businessDescription: 'Vente de produits électroniques et accessoires'
      }
    };

    // Vérifier si l'utilisateur existe déjà
    const existingVendor = await User.findOne({ email: vendorData.email });
    if (existingVendor) {
      console.log('⚠️ Un vendeur avec cet email existe déjà');
      console.log(`   Statut actuel: ${existingVendor.status}`);
      return;
    }

    // Créer le vendeur
    const vendor = new User(vendorData);
    await vendor.save();

    console.log('✅ Vendeur test créé avec succès:');
    console.log(`   👤 Nom: ${vendor.firstName} ${vendor.lastName}`);
    console.log(`   📧 Email: ${vendor.email}`);
    console.log(`   📱 Téléphone: ${vendor.phone}`);
    console.log(`   👔 Rôle: ${vendor.role}`);
    console.log(`   📊 Statut: ${vendor.status}`);
    console.log(`   🏢 Entreprise: ${vendor.vendorInfo.businessName}`);
    console.log(`   📅 Créé le: ${new Date(vendor.createdAt).toLocaleString('fr-FR')}`);

    // Vérifier tous les utilisateurs maintenant
    const allUsers = await User.find({}, 'firstName lastName email role status createdAt');
    console.log(`\n📋 Total utilisateurs: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} - ${user.role} [${user.status}]`);
    });

    // Compter par statut
    const pendingVendors = await User.countDocuments({ role: 'vendeur', status: 'en_attente' });
    const activeUsers = await User.countDocuments({ status: 'actif' });
    
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