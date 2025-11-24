const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const testAuthMe = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tyda-vente');
    console.log('✅ Connecté à MongoDB');

    // Récupérer le dernier utilisateur créé (non admin)
    const user = await User.findOne({ role: { $ne: 'admin' } }).sort({ createdAt: -1 });
    
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }

    console.log('\n👤 Utilisateur trouvé:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Nom: ${user.firstName} ${user.lastName}`);
    console.log(`   Téléphone: ${user.phone}`);
    console.log(`   Email: ${user.email || 'Non défini'}`);
    console.log(`   Adresse: ${user.address || 'Non définie'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.accountStatus}`);

    // Générer un token JWT pour cet utilisateur
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET || 'votre_secret_jwt_ultra_securise',
      { expiresIn: '30d' }
    );

    console.log('\n🔑 Token JWT généré:');
    console.log(token);

    console.log('\n📝 Pour tester dans le navigateur, exécutez:');
    console.log(`localStorage.setItem('tyda_token', '${token}');`);
    console.log(`localStorage.setItem('tyda_user_role', '${user.role}');`);
    console.log('\nPuis rechargez la page.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
};

testAuthMe();
