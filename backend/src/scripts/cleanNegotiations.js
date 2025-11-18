const mongoose = require('mongoose');
require('dotenv').config();

const Negotiation = require('../models/Negotiation');

const cleanNegotiations = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté\n');

    // Supprimer toutes les négociations
    const result = await Negotiation.deleteMany({});
    
    console.log(`✅ ${result.deletedCount} négociations supprimées\n`);
    console.log('Vous pouvez maintenant créer une nouvelle négociation propre.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

cleanNegotiations();
