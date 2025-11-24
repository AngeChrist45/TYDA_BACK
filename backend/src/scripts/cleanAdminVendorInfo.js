const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function cleanAdminVendorInfo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Utiliser updateMany avec $unset pour éviter la validation
    const result = await User.collection.updateMany(
      { role: 'admin' },
      { $unset: { vendorInfo: "" } }
    );

    console.log(`✅ ${result.modifiedCount} admin(s) nettoyé(s)\n`);

    // Vérifier
    const admins = await User.find({ role: 'admin' }).select('firstName lastName role vendorInfo').lean();
    console.log('📋 Admins après nettoyage:');
    admins.forEach(admin => {
      console.log(`  - ${admin.firstName} ${admin.lastName}: vendorInfo = ${admin.vendorInfo ? 'EXISTS' : 'NONE'}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

cleanAdminVendorInfo();
