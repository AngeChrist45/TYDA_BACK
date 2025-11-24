const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function checkUserNotifications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    const phone = '+2250768500697';
    const user = await User.findOne({ phone });

    if (!user) {
      console.log('❌ Utilisateur introuvable');
      return;
    }

    console.log('👤 Utilisateur:', user.firstName, user.lastName);
    console.log('📧 Email:', user.email);
    console.log('🎭 Rôle:', user.role);
    console.log('\n📋 VendorInfo:');
    console.log(JSON.stringify(user.vendorInfo, null, 2));
    console.log('\n🔔 Notifications:', user.notifications.length);
    
    user.notifications.forEach((notif, index) => {
      console.log(`\n📬 Notification ${index + 1}:`);
      console.log('  Type:', notif.type);
      console.log('  Titre:', notif.title);
      console.log('  Message:', notif.message);
      console.log('  Lu:', notif.read);
      console.log('  Date:', notif.createdAt);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserNotifications();
