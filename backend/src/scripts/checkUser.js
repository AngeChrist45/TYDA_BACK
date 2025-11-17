const mongoose = require('mongoose');
const User = require('../models/User');

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tyda-vente', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const checkUser = async () => {
  try {
    console.log('🔍 Recherche de l\'utilisateur +2250123456789...');
    
    const user = await User.findOne({ phone: '+2250123456789' });
    
    if (!user) {
      console.log('❌ Utilisateur +2250123456789 non trouvé');
      console.log('📋 Utilisateurs existants:');
      
      const allUsers = await User.find({}, 'phone firstName lastName role accountStatus').limit(10);
      allUsers.forEach(u => {
        console.log(`   - ${u.phone} (${u.firstName} ${u.lastName}) - ${u.role} [${u.accountStatus}]`);
      });
    } else {
      console.log('✅ Utilisateur trouvé:', {
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accountStatus: user.accountStatus,
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt
      });
      
      console.log('\n🔑 COORDONNÉES DE CONNEXION:');
      console.log('📱 Téléphone:', user.phone);
      console.log('🔐 PIN: 1234 (vendeur test)');
      console.log('👤 Role:', user.role);
      console.log('📊 Status:', user.accountStatus);
      
      if (user.role === 'vendeur' && user.vendorInfo) {
        console.log('\n🏪 Informations vendeur:');
        console.log('   - Nom boutique:', user.vendorInfo.businessName);
        console.log('   - Status validation:', user.vendorInfo.validationStatus);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.disconnect();
  }
};

checkUser();