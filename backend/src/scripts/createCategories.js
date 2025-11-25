require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const categories = [
  {
    name: 'Électronique',
    description: 'Smartphones, ordinateurs, tablettes et accessoires électroniques',
    slug: 'electronique',
    icon: 'fas fa-laptop',
    sortOrder: 1
  },
  {
    name: 'Mode & Vêtements',
    description: 'Vêtements, chaussures et accessoires de mode',
    slug: 'mode-vetements',
    icon: 'fas fa-tshirt',
    sortOrder: 2
  },
  {
    name: 'Maison & Décoration',
    description: 'Meubles, décoration et articles pour la maison',
    slug: 'maison-decoration',
    icon: 'fas fa-home',
    sortOrder: 3
  },
  {
    name: 'Beauté & Santé',
    description: 'Produits de beauté, cosmétiques et santé',
    slug: 'beaute-sante',
    icon: 'fas fa-heart',
    sortOrder: 4
  },
  {
    name: 'Sports & Loisirs',
    description: 'Articles de sport, loisirs et activités de plein air',
    slug: 'sports-loisirs',
    icon: 'fas fa-futbol',
    sortOrder: 5
  },
  {
    name: 'Alimentation',
    description: 'Produits alimentaires, boissons et épicerie',
    slug: 'alimentation',
    icon: 'fas fa-utensils',
    sortOrder: 6
  },
  {
    name: 'Livres & Médias',
    description: 'Livres, magazines, films et musique',
    slug: 'livres-medias',
    icon: 'fas fa-book',
    sortOrder: 7
  },
  {
    name: 'Jouets & Enfants',
    description: 'Jouets, jeux et articles pour enfants',
    slug: 'jouets-enfants',
    icon: 'fas fa-gamepad',
    sortOrder: 8
  },
  {
    name: 'Auto & Moto',
    description: 'Pièces auto, accessoires et équipements véhicules',
    slug: 'auto-moto',
    icon: 'fas fa-car',
    sortOrder: 9
  },
  {
    name: 'Jardin & Bricolage',
    description: 'Outils, équipements de jardin et bricolage',
    slug: 'jardin-bricolage',
    icon: 'fas fa-tools',
    sortOrder: 10
  },
  {
    name: 'Animaux',
    description: 'Nourriture et accessoires pour animaux',
    slug: 'animaux',
    icon: 'fas fa-paw',
    sortOrder: 11
  },
  {
    name: 'Autres',
    description: 'Autres produits et services',
    slug: 'autres',
    icon: 'fas fa-tag',
    sortOrder: 12
  }
];

async function createCategories() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Vérifier si des catégories existent déjà
    const existingCount = await Category.countDocuments();
    console.log(`📊 Catégories existantes: ${existingCount}`);

    if (existingCount > 0) {
      console.log('⚠️  Des catégories existent déjà. Voulez-vous les supprimer? (Ctrl+C pour annuler)');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await Category.deleteMany({});
      console.log('🗑️  Anciennes catégories supprimées');
    }

    // Créer les nouvelles catégories
    const created = await Category.insertMany(categories);
    console.log(`✅ ${created.length} catégories créées avec succès!`);

    // Afficher les catégories créées
    console.log('\n📋 Catégories créées:');
    created.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.slug})`);
    });

    console.log('\n🎉 Initialisation terminée!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter
createCategories();
