const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Negotiation = require('../models/Negotiation');

const clearDatabaseExceptAdmin = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n⚠️  Suppression de toutes les données SAUF les admins...\n');

    // Supprimer tous les utilisateurs sauf les admins
    const usersResult = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`✅ Utilisateurs (non-admin): ${usersResult.deletedCount} supprimés`);

    // Supprimer tous les produits
    const productsResult = await Product.deleteMany({});
    console.log(`✅ Produits: ${productsResult.deletedCount} supprimés`);

    // Supprimer toutes les catégories
    const categoriesResult = await Category.deleteMany({});
    console.log(`✅ Catégories: ${categoriesResult.deletedCount} supprimées`);

    // Supprimer toutes les commandes
    const ordersResult = await Order.deleteMany({});
    console.log(`✅ Commandes: ${ordersResult.deletedCount} supprimées`);

    // Supprimer tous les paniers
    const cartsResult = await Cart.deleteMany({});
    console.log(`✅ Paniers: ${cartsResult.deletedCount} supprimés`);

    // Supprimer toutes les négociations
    const negotiationsResult = await Negotiation.deleteMany({});
    console.log(`✅ Négociations: ${negotiationsResult.deletedCount} supprimées`);

    // Compter les admins restants
    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log(`\n👤 Admins conservés: ${adminCount}`);

    // Lister les admins
    const admins = await User.find({ role: 'admin' }, 'firstName lastName email phone');
    console.log('\n📋 Liste des admins:');
    admins.forEach(admin => {
      console.log(`   - ${admin.firstName} ${admin.lastName} (${admin.email || admin.phone})`);
    });

    console.log('\n✅ Base de données nettoyée avec succès!\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

clearDatabaseExceptAdmin();
