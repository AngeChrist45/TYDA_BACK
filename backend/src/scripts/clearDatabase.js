const mongoose = require('mongoose');
require('dotenv').config();

const clearDatabase = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer toutes les collections
    const collections = await mongoose.connection.db.collections();
    
    console.log(`\n📋 Collections trouvées: ${collections.length}`);
    collections.forEach(collection => {
      console.log(`   - ${collection.collectionName}`);
    });

    // Demander confirmation
    console.log('\n⚠️  ATTENTION: Toutes les données vont être supprimées!');
    console.log('Suppression en cours...\n');

    // Supprimer toutes les données de chaque collection
    for (const collection of collections) {
      const result = await collection.deleteMany({});
      console.log(`✅ ${collection.collectionName}: ${result.deletedCount} documents supprimés`);
    }

    console.log('\n✅ Base de données vidée avec succès!');
    console.log('Vous pouvez maintenant faire de nouvelles inscriptions.\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

clearDatabase();
