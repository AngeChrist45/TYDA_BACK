const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function makeUserAdmin() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    console.log('🔧 Mise à jour du rôle admin...');
    const user = await User.findOne({ phone: '+2250700000000' });

    if (!user) {
      console.log('❌ Utilisateur introuvable!');
      return;
    }

    console.log('Rôles actuels:', user.roles);
    
    // Remplacer par admin uniquement
    user.roles = ['admin'];
    await user.save();

    console.log('✅ Rôles mis à jour:', user.roles);
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

makeUserAdmin();
