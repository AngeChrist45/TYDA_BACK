const axios = require('axios');

const API_URL = 'https://tyda-back.onrender.com/api';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTIyMjE4NzFiNGZmNWRlNzY3NTlkYWEiLCJwaG9uZSI6IisyMjUwNzY4NTAwNjk3Iiwicm9sZSI6ImNsaWVudCIsImlhdCI6MTc2Mzk5MDg1MSwiZXhwIjoxNzY0NTk1NjUxfQ.C8-bV37DZMmZOQaNqo5H5cDgzndepFft2F29ETrdOyQ';

async function testAuthMe() {
  try {
    console.log('🔍 Test de /auth/me...\n');
    
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Succès!');
    console.log('📊 Données reçues:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.status || error.message);
    if (error.response?.data) {
      console.error('📋 Détails:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAuthMe();
