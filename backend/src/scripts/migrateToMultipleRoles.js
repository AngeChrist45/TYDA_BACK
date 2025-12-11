const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function migrateToMultipleRoles() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    console.log('🔄 Migration vers le système de rôles multiples...\n');

    // Récupérer tous les utilisateurs
    const users = await User.find();
    console.log(`📊 ${users.length} utilisateur(s) à migrer\n`);

    let migrated = 0;
    let skipped = 0;

    for (const user of users) {
      // Si l'utilisateur a déjà le champ roles, on skip
      if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
        console.log(`⏭️  ${user.firstName} ${user.lastName} (${user.phone}) - Déjà migré`);
        skipped++;
        continue;
      }

      // Migrer selon l'ancien rôle
      const oldRole = user.role || 'client';
      
      if (oldRole === 'admin') {
        // Admin reste admin uniquement
        user.roles = ['admin'];
      } else if (oldRole === 'vendeur') {
        // Vendeur devient client + vendeur
        user.roles = ['client', 'vendeur'];
      } else {
        // Client reste client
        user.roles = ['client'];
      }

      await user.save();
      console.log(`✅ ${user.firstName} ${user.lastName} (${user.phone}) - ${oldRole} → [${user.roles.join(', ')}]`);
      migrated++;
    }

    console.log('\n📊 Résumé de la migration:');
    console.log(`   ✅ Migrés: ${migrated}`);
    console.log(`   ⏭️  Déjà migrés: ${skipped}`);
    console.log(`   📊 Total: ${users.length}\n`);

    // Afficher la répartition finale
    const allUsers = await User.find();
    const admins = allUsers.filter(u => u.roles?.includes('admin'));
    const vendeurs = allUsers.filter(u => u.roles?.includes('vendeur'));
    const clients = allUsers.filter(u => u.roles?.includes('client'));

    console.log('📈 Répartition des rôles:');
    console.log(`   👑 Admins: ${admins.length}`);
    console.log(`   🏪 Vendeurs (client + vendeur): ${vendeurs.length}`);
    console.log(`   👤 Clients uniquement: ${clients.length - vendeurs.length}\n`);

    console.log('✨ Migration terminée avec succès!\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnexion de MongoDB');
    process.exit(0);
  }
}

migrateToMultipleRoles();
