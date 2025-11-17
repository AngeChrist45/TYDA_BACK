const mongoose = require('mongoose');
const User = require('../models/User');

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tyda-vente', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const checkUser = async () => {
  try {
    console.log('🔍 Recherche de l\'utilisateur vendeur.test@tyda-vente.ci...');
    
    const user = await User.findOne({ email: 'vendeur.test@tyda-vente.ci' }).select('+password');
    
    if (!user) {
      console.log('❌ Utilisateur vendeur.test@tyda-vente.ci non trouvé');
      console.log('📋 Utilisateurs existants:');
      
      const allUsers = await User.find({}, 'email firstName lastName role status').limit(10);
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.firstName} ${u.lastName}) - ${u.role} [${u.status}]`);
      });
    } else {
      console.log('✅ Utilisateur trouvé:', {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        hasPassword: !!user.password
      });
      
      console.log('\n🔑 COORDONNÉES DE CONNEXION:');
      console.log('📧 Email:', user.email);
      console.log('🔒 Mot de passe: [VOIR LE SCRIPT DE CRÉATION]');
      console.log('👤 Role:', user.role);
      console.log('📊 Status:', user.status);
      
      if (user.role === 'vendeur' && user.vendorInfo) {
        console.log('\n🏪 Informations vendeur:');
        console.log('   - Nom boutique:', user.vendorInfo.businessName);
        console.log('   - Status approbation:', user.vendorInfo.approvalStatus);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.disconnect();
  }
};

checkUser();