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
      console.log('Un administrateur existe déjà:', existingAdmin.email);
      process.exit(0);
    }

    // Créer un administrateur par défaut
    const adminData = {
      firstName: 'Admin',
      lastName: 'TYDA',
      email: 'admin@tyda-vente.ci',
      password: 'admin123456', // Sera hashé automatiquement
      phone: '+2250700000000',
      role: 'admin',
      status: 'actif',
      location: {
        city: 'Abidjan',
        commune: 'Plateau',
        quartier: 'Centre-ville',
        coordinates: [
          -4.0314, // longitude
          5.3364   // latitude
        ]
      },
      isEmailVerified: true,
      isPhoneVerified: true
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Administrateur créé avec succès !');
    console.log('📧 Email: admin@tyda-vente.ci');
    console.log('🔑 Mot de passe: admin123456');
    console.log('⚠️  Changez le mot de passe après la première connexion !');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();