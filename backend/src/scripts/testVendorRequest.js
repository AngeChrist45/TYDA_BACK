const axios = require('axios');

const API_URL = 'https://tyda-back.onrender.com/api';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTIyMjE4NzFiNGZmNWRlNzY3NTlkYWEiLCJwaG9uZSI6IisyMjUwNzY4NTAwNjk3Iiwicm9sZSI6ImNsaWVudCIsImlhdCI6MTc2Mzk5MDg1MSwiZXhwIjoxNzY0NTk1NjUxfQ.C8-bV37DZMmZOQaNqo5H5cDgzndepFft2F29ETrdOyQ';

async function testVendorRequest() {
  try {
    console.log('🔍 Test de /vendors/request...\n');
    
    const data = {
      fullName: "Jean Kouassi Test",
      businessName: "Boutique Test",
      businessDescription: "Test description de l'entreprise",
      businessAddress: "Abidjan, Cocody",
      photo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      identityDocument: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    };

    const response = await axios.post(`${API_URL}/vendors/request`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Succès!');
    console.log('📊 Réponse:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.status || error.message);
    if (error.response?.data) {
      console.error('📋 Détails:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testVendorRequest();
