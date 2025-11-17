const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkAllUsers = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les utilisateurs
    const allUsers = await User.find({}, 'firstName lastName email phone role status createdAt vendorInfo');
    
    console.log(`📊 Total utilisateurs dans la base: ${allUsers.length}`);
    console.log('=' .repeat(60));

    if (allUsers.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
    } else {
      allUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   📱 Téléphone: ${user.phone || 'Non renseigné'}`);
        console.log(`   👤 Rôle: ${user.role}`);
        console.log(`   📈 Statut: ${user.status}`);
        console.log(`   📅 Créé le: ${new Date(user.createdAt).toLocaleString('fr-FR')}`);
        
        if (user.role === 'vendeur' && user.vendorInfo) {
          console.log(`   🏢 Entreprise: ${user.vendorInfo.businessName || 'Non renseigné'}`);
          console.log(`   📝 Description: ${user.vendorInfo.businessDescription || 'Non renseigné'}`);
        }
        console.log('   ' + '-'.repeat(50));
      });

      // Statistiques par rôle et statut
      const stats = {
        admins: allUsers.filter(u => u.role === 'admin').length,
        clients: allUsers.filter(u => u.role === 'client').length,
        vendeurs: allUsers.filter(u => u.role === 'vendeur').length,
        actifs: allUsers.filter(u => u.status === 'active').length,
        enAttente: allUsers.filter(u => u.status === 'pending').length,
        suspendu: allUsers.filter(u => u.status === 'suspended').length
      };

      console.log('\n📊 STATISTIQUES:');
      console.log(`   👑 Administrateurs: ${stats.admins}`);
      console.log(`   👤 Clients: ${stats.clients}`);
      console.log(`   🏪 Vendeurs: ${stats.vendeurs}`);
      console.log(`   ✅ Actifs: ${stats.actifs}`);
      console.log(`   ⏳ En attente: ${stats.enAttente}`);
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