const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const testAdminLogin = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connexion à MongoDB réussie');

    // Vérifier si l'admin existe
    const admin = await User.findOne({ 
      email: 'admin@tyda-vente.ci' 
    }).select('+password');

    if (!admin) {
      console.log('❌ Admin non trouvé');
      process.exit(1);
    }

    console.log('✅ Admin trouvé:', admin.email);
    console.log('📧 Email:', admin.email);
    console.log('🔒 Role:', admin.role);
    console.log('📱 Phone:', admin.phone);
    console.log('✅ Status:', admin.status);

    // Tester le mot de passe
    const isPasswordValid = await admin.comparePassword('admin123456');
    console.log('🔑 Mot de passe valide:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Le mot de passe ne correspond pas');
    } else {
      console.log('✅ Le mot de passe est correct');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testAdminLogin();