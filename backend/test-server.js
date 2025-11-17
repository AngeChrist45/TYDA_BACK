const express = require('express');
const cors = require('cors');
const User = require('./src/models/User');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend connecté!',
    timestamp: new Date().toISOString()
  });
});

// Simple login test
app.post('/api/auth/test-login', async (req, res) => {
  try {
    console.log('📥 Données reçues:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
        received: { email: !!email, password: !!password }
      });
    }

    // Connecter à MongoDB si pas déjà fait
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('💾 MongoDB connecté');
    }

    // Chercher l'utilisateur
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    res.json({
      success: true,
      message: 'Connexion réussie!',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur test démarré sur port ${PORT}`);
  console.log(`📋 Routes disponibles:`);
  console.log(`   GET  http://localhost:${PORT}/api/test`);
  console.log(`   POST http://localhost:${PORT}/api/auth/test-login`);
});