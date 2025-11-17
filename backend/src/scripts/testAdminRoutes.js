const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();

const testAdminRoutes = async () => {
  try {
    // Générer un token admin
    const adminToken = jwt.sign(
      { 
        userId: '68fb96c85867bbb0c8f84ab5', 
        role: 'admin', 
        status: 'actif' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('🔑 Token admin généré');
    console.log('📡 Test des routes admin...\n');

    const API_BASE_URL = 'http://localhost:5000/api';

    // Test 1: Liste des utilisateurs
    console.log('📋 Test 1: Liste des utilisateurs');
    try {
      const usersResponse = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('✅ Route /admin/users fonctionne');
        console.log(`   Utilisateurs trouvés: ${usersData.data?.users?.length || 0}`);
        
        if (usersData.data?.users) {
          usersData.data.users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} - ${user.role} [${user.status}]`);
          });
        }
      } else {
        console.log('❌ Erreur route /admin/users:', usersResponse.status);
        const errorText = await usersResponse.text();
        console.log('   Détails:', errorText);
      }
    } catch (error) {
      console.log('❌ Erreur réseau /admin/users:', error.message);
    }

    console.log('\n');

    // Test 2: Dashboard admin
    console.log('📊 Test 2: Dashboard admin');
    try {
      const dashboardResponse = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log('✅ Route /admin/dashboard fonctionne');
        console.log('   Stats:', JSON.stringify(dashboardData.data?.stats, null, 2));
      } else {
        console.log('❌ Erreur route /admin/dashboard:', dashboardResponse.status);
        const errorText = await dashboardResponse.text();
        console.log('   Détails:', errorText);
      }
    } catch (error) {
      console.log('❌ Erreur réseau /admin/dashboard:', error.message);
    }

    console.log('\n');

    // Test 3: Vendeurs en attente
    console.log('🏪 Test 3: Vendeurs en attente');
    try {
      const vendorsResponse = await fetch(`${API_BASE_URL}/admin/vendors/pending`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (vendorsResponse.ok) {
        const vendorsData = await vendorsResponse.json();
        console.log('✅ Route /admin/vendors/pending fonctionne');
        console.log(`   Vendeurs en attente: ${vendorsData.data?.vendors?.length || 0}`);
        
        if (vendorsData.data?.vendors) {
          vendorsData.data.vendors.forEach((vendor, index) => {
            console.log(`   ${index + 1}. ${vendor.firstName} ${vendor.lastName} - ${vendor.vendorInfo?.businessName || 'N/A'}`);
          });
        }
      } else {
        console.log('❌ Erreur route /admin/vendors/pending:', vendorsResponse.status);
        const errorText = await vendorsResponse.text();
        console.log('   Détails:', errorText);
      }
    } catch (error) {
      console.log('❌ Erreur réseau /admin/vendors/pending:', error.message);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
};

// Vérifier si le serveur backend est en marche
const checkServer = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/health');
    if (response.ok) {
      console.log('✅ Serveur backend accessible\n');
      await testAdminRoutes();
    } else {
      throw new Error('Serveur ne répond pas correctement');
    }
  } catch (error) {
    console.log('❌ Serveur backend non accessible:', error.message);
    console.log('💡 Assurez-vous que le serveur backend est démarré sur le port 5000');
  }
};

checkServer();