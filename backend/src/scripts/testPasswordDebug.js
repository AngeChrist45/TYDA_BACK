const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tyda-vente', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const testPasswordDebug = async () => {
  try {
    console.log('🔍 Debug détaillé du mot de passe admin...');
    
    const admin = await User.findOne({ email: 'admin@tyda-vente.ci' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin non trouvé');
      return;
    }
    
    console.log('✅ Admin trouvé:', admin.email);
    console.log('🔑 Hash stocké:', admin.password);
    console.log('📏 Longueur du hash:', admin.password.length);
    
    const testPassword = 'Admin123@';
    console.log('🔑 Mot de passe test:', testPassword);
    
    // Test avec bcrypt directement
    const isMatch1 = await bcrypt.compare(testPassword, admin.password);
    console.log('✅ Test bcrypt.compare:', isMatch1);
    
    // Test avec la méthode du modèle
    const isMatch2 = await admin.comparePassword(testPassword);
    console.log('✅ Test admin.comparePassword:', isMatch2);
    
    // Générer un nouveau hash pour comparaison
    const newHash = await bcrypt.hash(testPassword, 12);
    console.log('🔑 Nouveau hash généré:', newHash);
    console.log('✅ Test nouveau hash:', await bcrypt.compare(testPassword, newHash));
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.disconnect();
  }
};

testPasswordDebug();