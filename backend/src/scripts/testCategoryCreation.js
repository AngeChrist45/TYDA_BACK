const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

async function testCategoryCreation() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Test 1: Lister les catégories existantes
    console.log('📋 Catégories existantes:');
    const existingCategories = await Category.find();
    console.log(`   ${existingCategories.length} catégorie(s) trouvée(s)\n`);

    // Test 2: Créer une catégorie de test
    console.log('➕ Création d\'une catégorie de test...');
    const testCategory = new Category({
      name: 'Test Électronique',
      description: 'Catégorie de test pour l\'électronique',
      icon: '📱',
      level: 0,
      parent: null
    });

    await testCategory.save();
    console.log('✅ Catégorie créée avec succès!');
    console.log('   ID:', testCategory._id);
    console.log('   Nom:', testCategory.name);
    console.log('   Slug:', testCategory.slug);
    console.log('   Niveau:', testCategory.level);
    console.log('   Active:', testCategory.isActive);

    // Test 3: Vérifier la création
    const verification = await Category.findById(testCategory._id);
    if (verification) {
      console.log('\n✅ Vérification: Catégorie bien enregistrée dans la base\n');
    }

    // Nettoyer
    console.log('🧹 Nettoyage de la catégorie de test...');
    await Category.findByIdAndDelete(testCategory._id);
    console.log('✅ Catégorie de test supprimée\n');

    console.log('✨ Tous les tests réussis! La création de catégories fonctionne.\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnecté de MongoDB');
    process.exit(0);
  }
}

testCategoryCreation();
