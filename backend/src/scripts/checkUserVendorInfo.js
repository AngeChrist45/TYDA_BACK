const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function checkUserVendorInfo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    const phone = '+2250768500697';
    const user = await User.findOne({ phone }).lean();

    if (!user) {
      console.log('❌ Utilisateur introuvable');
      return;
    }

    console.log('👤 Utilisateur:', user.firstName, user.lastName);
    console.log('📧 Email:', user.email);
    console.log('🎭 Rôle:', user.role);
    console.log('\n📋 VendorInfo complet:');
    console.log(JSON.stringify(user.vendorInfo, null, 2));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserVendorInfo();
