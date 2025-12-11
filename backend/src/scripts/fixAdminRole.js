const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function fixAdminRole() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    console.log('🔧 Correction du rôle admin...');
    const admin = await User.findOne({ phone: '+2250700000000' });

    if (!admin) {
      console.log('❌ Admin introuvable!');
      return;
    }

    console.log('Rôle actuel:', admin.role);
    admin.role = 'admin';
    await admin.save();

    console.log('✅ Rôle corrigé avec succès!');
    console.log('Nouveau rôle:', admin.role);

    console.log('\n✨ Vous pouvez maintenant vous connecter au backoffice avec:');
    console.log('   📱 Téléphone: +2250700000000');
    console.log('   🔐 PIN: 0000\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnecté de MongoDB');
    process.exit(0);
  }
}

fixAdminRole();
