const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkAllUsers = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les utilisateurs
    const allUsers = await User.find({}, 'firstName lastName phone role accountStatus createdAt vendorInfo isPhoneVerified');
    
    console.log(`📊 Total utilisateurs dans la base: ${allUsers.length}`);
    console.log('=' .repeat(60));

    if (allUsers.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
    } else {
      allUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📱 Téléphone: ${user.phone}`);
        console.log(`   👤 Rôle: ${user.role}`);
        console.log(`   📈 Statut: ${user.accountStatus}`);
        console.log(`   ✅ Téléphone vérifié: ${user.isPhoneVerified ? 'Oui' : 'Non'}`);
        console.log(`   📅 Créé le: ${new Date(user.createdAt).toLocaleString('fr-FR')}`);
        
        if (user.vendorInfo && user.vendorInfo.businessName) {
          console.log(`   🏢 Entreprise: ${user.vendorInfo.businessName}`);
          console.log(`   📝 Status vendeur: ${user.vendorInfo.validationStatus}`);
        }
        console.log('   ' + '-'.repeat(50));
      });

      // Statistiques par rôle et statut
      const stats = {
        admins: allUsers.filter(u => u.role === 'admin').length,
        clients: allUsers.filter(u => u.role === 'client').length,
        vendeurs: allUsers.filter(u => u.role === 'vendeur').length,
        actifs: allUsers.filter(u => u.accountStatus === 'active').length,
        enAttente: allUsers.filter(u => u.accountStatus === 'pending_verification').length,
        suspendu: allUsers.filter(u => u.accountStatus === 'suspended').length
      };

      console.log('\n📊 STATISTIQUES:');
      console.log(`   👑 Administrateurs: ${stats.admins}`);
      console.log(`   👤 Clients: ${stats.clients}`);
      console.log(`   🏪 Vendeurs: ${stats.vendeurs}`);
      console.log(`   ✅ Actifs: ${stats.actifs}`);
      console.log(`   ⏳ En attente vérification: ${stats.enAttente}`);
      console.log(`   ⛔ Suspendus: ${stats.suspendu}`);

      // Afficher spécifiquement les vendeurs en attente
      const vendeursEnAttente = allUsers.filter(u => u.role === 'vendeur' && u.status === 'pending');
      if (vendeursEnAttente.length > 0) {
        console.log('\n🔔 VENDEURS EN ATTENTE D\'APPROBATION:');
        vendeursEnAttente.forEach(vendor => {
          console.log(`   - ${vendor.firstName} ${vendor.lastName} (${vendor.email})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
};

checkAllUsers();