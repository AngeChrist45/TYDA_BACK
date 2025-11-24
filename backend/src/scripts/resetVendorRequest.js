const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function resetVendorRequest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    const phone = '+2250768500697'; // Ton numéro

    const user = await User.findOne({ phone });
    
    if (!user) {
      console.log('❌ Utilisateur introuvable');
      return;
    }

    console.log('👤 Avant:', {
      nom: user.firstName + ' ' + user.lastName,
      role: user.role,
      vendorInfo: user.vendorInfo
    });

    // Supprimer complètement vendorInfo
    user.vendorInfo = undefined;

    await user.save();

    console.log('\n✅ VendorInfo réinitialisé avec succès!');
    console.log('👤 Après:', {
      nom: user.firstName + ' ' + user.lastName,
      role: user.role,
      vendorInfo: user.vendorInfo
    });

    console.log('\n💡 Tu peux maintenant refaire une demande vendeur complète.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

resetVendorRequest();
