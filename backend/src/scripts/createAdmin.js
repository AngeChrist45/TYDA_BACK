const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connexion à MongoDB réussie');

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Un administrateur existe déjà:', existingAdmin.phone);
      process.exit(0);
    }

    // Créer un administrateur par défaut
    const adminData = {
      firstName: 'Admin',
      lastName: 'TYDA',
      phone: '+2250700000000',
      pin: '0000', // PIN admin par défaut - à changer !
      role: 'admin',
      accountStatus: 'active',
      isPhoneVerified: true
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Administrateur créé avec succès !');
    console.log('📱 Téléphone: +2250700000000');
    console.log('🔐 PIN: 0000');
    console.log('⚠️  Changez le PIN après la première connexion !');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();