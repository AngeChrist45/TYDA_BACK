const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function testAdminLogin() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Chercher l'admin
    console.log('🔍 Recherche de l\'admin...');
    const admin = await User.findOne({ phone: '+2250700000000' });

    if (!admin) {
      console.log('❌ Admin introuvable dans la base de données!');
      console.log('📝 Création d\'un nouvel admin...\n');

      const newAdmin = new User({
        firstName: 'Admin',
        lastName: 'TYDA',
        phone: '+2250700000000',
        role: 'admin',
        pin: '0000',
        accountStatus: 'active',
        isPhoneVerified: true
      });

      await newAdmin.save();
      console.log('✅ Admin créé avec succès!');
      console.log('📱 Téléphone:', newAdmin.phone);
      console.log('🔐 PIN: 0000');
      console.log('👤 Rôle:', newAdmin.role);
      console.log('📊 Statut:', newAdmin.accountStatus);
    } else {
      console.log('✅ Admin trouvé!');
      console.log('📱 Téléphone:', admin.phone);
      console.log('👤 Rôle:', admin.role);
      console.log('📊 Statut du compte:', admin.accountStatus);
      console.log('📧 Email:', admin.email || 'Non défini');
      console.log('🔐 PIN hashé:', admin.pin ? 'Oui' : 'Non');
      console.log('📞 Téléphone vérifié:', admin.isPhoneVerified);

      // Tester le PIN
      console.log('\n🧪 Test du PIN "0000"...');
      const isPinValid = await admin.comparePin('0000');
      console.log('✅ PIN valide:', isPinValid);

      if (!isPinValid) {
        console.log('\n⚠️  Le PIN ne correspond pas!');
        console.log('🔧 Réinitialisation du PIN à "0000"...');
        admin.pin = '0000';
        await admin.save();
        console.log('✅ PIN réinitialisé avec succès!');
      }

      // Vérifier les tentatives de connexion
      if (admin.pinAttempts > 0) {
        console.log('\n⚠️  Tentatives échouées:', admin.pinAttempts);
        console.log('🔧 Réinitialisation des tentatives...');
        await admin.resetPinAttempts();
        console.log('✅ Tentatives réinitialisées!');
      }

      // Vérifier si le compte est verrouillé
      if (admin.isPinLocked && admin.isPinLocked()) {
        console.log('\n🔒 Compte verrouillé!');
        console.log('🔧 Déverrouillage du compte...');
        admin.pinLockedUntil = null;
        admin.pinAttempts = 0;
        await admin.save();
        console.log('✅ Compte déverrouillé!');
      }
    }

    console.log('\n📋 Tous les utilisateurs dans la base:');
    const allUsers = await User.find().select('firstName lastName phone role accountStatus');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} - ${user.phone} (${user.role}) - ${user.accountStatus}`);
    });

    console.log('\n✨ Vous pouvez maintenant vous connecter avec:');
    console.log('   📱 Téléphone: +2250700000000');
    console.log('   🔐 PIN: 0000\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnecté de MongoDB');
    process.exit(0);
  }
}

testAdminLogin();
