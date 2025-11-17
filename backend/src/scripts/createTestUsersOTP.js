const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createTestUsers = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tyda-vente', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connecté à MongoDB');

    // Créer quelques utilisateurs test pour l'OTP
    const testUsers = [
      {
        firstName: 'Marie',
        lastName: 'Kouassi',
        email: 'marie.test@gmail.com',
        phone: '+2250101234567',
        password: await bcrypt.hash('Test123@', 12),
        role: 'client',
        status: 'actif',
        address: {
          street: 'Rue des Jardins',
          city: 'Abidjan',
          region: 'Cocody',
          country: 'Côte d\'Ivoire'
        }
      },
      {
        firstName: 'Kouadio',
        lastName: 'Vendeur',
        email: 'kouadio.vendeur@gmail.com',
        phone: '+2250798765432',
        password: await bcrypt.hash('Vendeur123@', 12),
        role: 'vendeur',
        status: 'actif',
        address: {
          street: 'Avenue du Commerce',
          city: 'Abidjan',
          region: 'Plateau',
          country: 'Côte d\'Ivoire'
        },
        vendorInfo: {
          businessName: 'Boutique Kouadio',
          businessType: 'retail',
          description: 'Vente de vêtements et accessoires',
          approvalStatus: 'approved'
        }
      }
    ];

    console.log('\n📝 Création des utilisateurs test...');

    for (const userData of testUsers) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ 
        $or: [{ email: userData.email }, { phone: userData.phone }] 
      });

      if (existingUser) {
        console.log(`⚠️  Utilisateur ${userData.email} existe déjà`);
        continue;
      }

      const user = new User(userData);
      await user.save();

      console.log(`✅ Créé: ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   📱 Téléphone: ${user.phone}`);
      console.log(`   👤 Rôle: ${user.role}`);
    }

    // Lister tous les utilisateurs
    console.log('\n📋 Utilisateurs dans la base de données:');
    const allUsers = await User.find({}, 'firstName lastName email phone role status');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`      📧 ${user.email}`);
      console.log(`      📱 ${user.phone}`);
      console.log(`      👤 ${user.role} [${user.status}]`);
      console.log('');
    });

    console.log('🎯 UTILISATEURS POUR TESTS OTP:');
    console.log('   1. marie.test@gmail.com / +2250101234567');
    console.log('   2. kouadio.vendeur@gmail.com / +2250798765432');
    console.log('   3. admin@tyda-vente.ci (admin existant)');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
};

createTestUsers();