const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function checkVendorRequests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Trouver tous les utilisateurs avec des demandes vendeur
    const usersWithVendorInfo = await User.find({
      'vendorInfo.validationStatus': { $exists: true }
    }).select('firstName lastName phone email role vendorInfo');

    console.log(`📊 Utilisateurs avec vendorInfo: ${usersWithVendorInfo.length}\n`);

    usersWithVendorInfo.forEach(user => {
      console.log('👤 Utilisateur:', user.firstName, user.lastName);
      console.log('   📧 Email:', user.email);
      console.log('   📱 Téléphone:', user.phone);
      console.log('   🎭 Rôle:', user.role);
      console.log('   📋 VendorInfo:', JSON.stringify(user.vendorInfo, null, 2));
      console.log('');
    });

    // Compter par statut
    const pending = await User.countDocuments({ 'vendorInfo.validationStatus': 'pending' });
    const approved = await User.countDocuments({ 'vendorInfo.validationStatus': 'approved' });
    const rejected = await User.countDocuments({ 'vendorInfo.validationStatus': 'rejected' });

    console.log('📈 Statistiques:');
    console.log(`   En attente: ${pending}`);
    console.log(`   Approuvées: ${approved}`);
    console.log(`   Rejetées: ${rejected}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkVendorRequests();
