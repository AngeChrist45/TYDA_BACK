// Script de test pour le système OTP
const API_BASE_URL = 'http://localhost:5000/api/auth/otp';

const testOTPSystem = async () => {
  console.log('🧪 Test du système OTP TYDA...\n');

  try {
    // Test 1: Demande d'OTP par email
    console.log('📧 Test 1: Demande OTP par email');
    const otpRequest = await fetch(`${API_BASE_URL}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'marie.test@gmail.com',
        method: 'email',
        type: 'login'
      }),
    });

    const otpData = await otpRequest.json();
    console.log('Résultat:', otpData);

    if (otpData.success) {
      console.log(`✅ OTP envoyé via: ${otpData.sentVia.join(', ')}`);
      console.log(`🔑 Session ID: ${otpData.sessionId}`);
      console.log(`⏰ Expire dans: ${Math.round(otpData.expiresIn / 1000 / 60)} minutes`);
      
      // En mode développement, le code est affiché dans les logs du serveur
      console.log('💡 Consultez les logs du serveur pour voir le code OTP');
    } else {
      console.log('❌ Échec demande OTP:', otpData.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Demande d'OTP par SMS
    console.log('📱 Test 2: Demande OTP par SMS');
    const smsRequest = await fetch(`${API_BASE_URL}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: '+2250798765432',
        method: 'sms',
        type: 'login'
      }),
    });

    const smsData = await smsRequest.json();
    console.log('Résultat:', smsData);

    if (smsData.success) {
      console.log(`✅ OTP envoyé via: ${smsData.sentVia.join(', ')}`);
      console.log(`🔑 Session ID: ${smsData.sessionId}`);
    } else {
      console.log('❌ Échec demande OTP SMS:', smsData.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Statistiques OTP
    console.log('📊 Test 3: Statistiques OTP');
    const statsRequest = await fetch(`${API_BASE_URL}/stats`);
    const statsData = await statsRequest.json();
    console.log('Statistiques:', statsData);

  } catch (error) {
    console.error('❌ Erreur test OTP:', error.message);
  }
};

// Exécuter le test
testOTPSystem();