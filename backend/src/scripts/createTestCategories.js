const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

async function createTestCategories() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Créer quelques catégories de test
    const categories = [
      {
        name: 'Électronique',
        description: 'Smartphones, ordinateurs, accessoires électroniques',
        icon: '📱',
      },
      {
        name: 'Mode',
        description: 'Vêtements, chaussures, accessoires de mode',
        icon: '👕',
      },
      {
        name: 'Alimentation',
        description: 'Nourriture, boissons, produits frais',
        icon: '🍔',
      },
      {
        name: 'Maison',
        description: 'Meubles, décoration, électroménager',
        icon: '🏠',
      },
      {
        name: 'Beauté',
        description: 'Cosmétiques, soins, parfums',
        icon: '💄',
      }
    ];

    console.log('➕ Création de catégories de test...\n');

    for (const catData of categories) {
      const category = new Category(catData);
      await category.save();
      console.log(`✅ ${catData.icon} ${catData.name} créée (slug: ${category.slug})`);
    }

    console.log('\n✨ Toutes les catégories ont été créées avec succès!\n');

    // Lister toutes les catégories
    const allCategories = await Category.find().sort({ name: 1 });
    console.log('📋 Catégories dans la base:');
    allCategories.forEach(cat => {
      console.log(`   ${cat.icon} ${cat.name} (ID: ${cat._id})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code === 11000) {
      console.error('⚠️  Certaines catégories existent déjà (erreur de duplication)');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB');
    process.exit(0);
  }
}

createTestCategories();
