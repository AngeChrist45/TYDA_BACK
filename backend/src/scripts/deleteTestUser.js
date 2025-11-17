const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const deleteTestUser = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Supprimer l'utilisateur test
    const testEmail = 'adohange149@gmail.com';
    
    const deletedUser = await User.findOneAndDelete({ email: testEmail });
    
    if (deletedUser) {
      console.log(`✅ Utilisateur supprimé: ${deletedUser.firstName} ${deletedUser.lastName} (${deletedUser.email})`);
      console.log(`   Rôle: ${deletedUser.role}`);
      console.log(`   Statut: ${deletedUser.status}`);
    } else {
      console.log('❌ Aucun utilisateur trouvé avec cet email');
    }

    // Afficher la liste des utilisateurs restants
    const remainingUsers = await User.find({}, 'firstName lastName email role status');
    console.log(`\n📋 Utilisateurs restants: ${remainingUsers.length}`);
    remainingUsers.forEach(user => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role} [${user.status}]`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
};

deleteTestUser();