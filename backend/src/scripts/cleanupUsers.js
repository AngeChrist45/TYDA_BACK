const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const cleanupUsers = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tyda-vente', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connecté à MongoDB');

    // Lister tous les utilisateurs avant suppression
    console.log('\n📋 Utilisateurs avant nettoyage:');
    const allUsersBefore = await User.find({}, 'firstName lastName phone role accountStatus');
    allUsersBefore.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} - ${user.phone} - ${user.role} [${user.accountStatus}]`);
    });

    // Supprimer tous les utilisateurs sauf les admins
    const deleteResult = await User.deleteMany({ 
      role: { $ne: 'admin' }  // Supprimer tous sauf les admins
    });

    console.log(`\n🗑️ Suppression effectuée: ${deleteResult.deletedCount} utilisateurs supprimés`);

    // Lister les utilisateurs restants
    console.log('\n📋 Utilisateurs restants:');
    const remainingUsers = await User.find({}, 'firstName lastName phone role accountStatus');
    
    if (remainingUsers.length === 0) {
      console.log('   Aucun utilisateur restant');
    } else {
      remainingUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} - ${user.phone} - ${user.role} [${user.accountStatus}]`);
      });
    }

    console.log(`\n📊 Total utilisateurs restants: ${remainingUsers.length}`);
    console.log('✅ Nettoyage terminé avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
};

cleanupUsers();