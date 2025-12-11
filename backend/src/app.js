const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Importation des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const negotiationRoutes = require('./routes/negotiations');
const cartRoutes = require('./routes/cart');
const favoritesRoutes = require('./routes/favorites');
const vendorsRoutes = require('./routes/vendors');
const adminRoutes = require('./modules/admin/routes/admin');
// Modules séparés par rôle
const clientProductsRoutes = require('./modules/client/routes/products');
const clientProfileRoutes = require('./modules/client/routes/profile');
const vendorProductsRoutes = require('./modules/vendor/routes/products');
const vendorProfileRoutes = require('./modules/vendor/routes/profile');
const vendorDashboardRoutes = require('./modules/vendor/routes/vendor');

// Import des middlewares
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

// Import des services
const NegotiationBot = require('./services/negotiationBot');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();
const server = createServer(app);

// Configuration Socket.IO pour le bot de négociation en temps réel
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Autoriser les requêtes sans origine
      if (!origin) return callback(null, true);
      
      // En développement, autoriser localhost et IP locales
      if (process.env.NODE_ENV !== 'production') {
        if (origin.includes('localhost') || origin.match(/^http:\/\/192\.168\.\d+\.\d+/)) {
          return callback(null, true);
        }
      }
      
      const allowedOrigins = [
        process.env.FRONTEND_WEB_URL || 'http://localhost:3000',
        process.env.FRONTEND_MOBILE_URL || 'http://localhost:19006',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:8080',
        'http://localhost:4173',
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true); // Autoriser pour dev
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialisation du bot de négociation avec Socket.IO
const negotiationBot = new NegotiationBot(io);

// Rendre io accessible dans les routes
app.set('io', io);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite de 100 requêtes par IP toutes les 15 minutes
});

// Middlewares globaux
app.use(helmet()); // Sécurité des headers HTTP
app.use(compression()); // Compression des réponses
app.use(morgan('combined')); // Logging des requêtes
app.use(limiter); // Rate limiting

// Configuration CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (Postman, mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_WEB_URL || 'http://localhost:3000',
      process.env.FRONTEND_MOBILE_URL || 'http://localhost:19006',
      'http://localhost:5173', // Vite dev server (frontend)
      'http://localhost:5174', // Vite dev server (alternate port)
      'http://localhost:8080', // Backoffice admin
      'http://localhost:4173', // Vite preview
    ];
    
    // En développement, autoriser toutes les origines localhost et IP locales
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.match(/^http:\/\/192\.168\.\d+\.\d+/)) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Trust proxy pour Render
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route de santé
// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'TYDA Vente API est fonctionnel',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Route racine pour Render
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TYDA API opérationnelle 🚀',
    health: '/api/health',
    routes: '/api/routes',
    version: '1.0.0'
  });
});

// Route pour lister tous les endpoints
app.get('/api/routes', (req, res) => {
  const routes = {
    '🏠 Général': {
      'GET /': 'Page d\'accueil de l\'API',
      'GET /api/health': 'État de santé du serveur',
      'GET /api/routes': 'Liste de tous les endpoints'
    },
    '🔐 Authentification': {
      'POST /api/auth/register': 'Inscription - Étape 1 (envoie OTP)',
      'POST /api/auth/verify-otp': 'Vérifier le code OTP - Étape 2',
      'POST /api/auth/set-pin': 'Définir le PIN - Étape 3 (finalise inscription)',
      'POST /api/auth/login': 'Connexion avec téléphone + PIN',
      'POST /api/auth/request-otp': 'Demander un nouveau OTP',
      'POST /api/auth/reset-pin': 'Réinitialiser le PIN',
      'POST /api/auth/change-pin': 'Changer le PIN (authentifié)',
      'GET /api/auth/me': 'Obtenir le profil utilisateur connecté',
      'POST /api/auth/logout': 'Déconnexion'
    },
    '👤 Utilisateurs': {
      'GET /api/users/profile': 'Obtenir son profil',
      'PUT /api/users/profile': 'Mettre à jour son profil',
      'PUT /api/users/address': 'Mettre à jour son adresse',
      'DELETE /api/users/notifications/:id': 'Supprimer une notification'
    },
    '🛍️ Produits (Client)': {
      'GET /api/client/products': 'Lister tous les produits',
      'GET /api/client/products/:id': 'Détails d\'un produit',
      'GET /api/client/products?negotiable=true': 'Produits négociables'
    },
    '📦 Produits (Vendeur)': {
      'GET /api/vendor/products/mine': 'Mes produits',
      'POST /api/vendor/products': 'Créer un produit',
      'PUT /api/vendor/products/:id': 'Modifier un produit',
      'DELETE /api/vendor/products/:id': 'Supprimer un produit',
      'GET /api/vendor/dashboard': 'Tableau de bord vendeur',
      'GET /api/vendor/orders': 'Commandes vendeur',
      'GET /api/vendor/notifications': 'Notifications vendeur'
    },
    '📁 Catégories': {
      'GET /api/categories': 'Lister toutes les catégories',
      'GET /api/categories?tree=true': 'Arbre des catégories',
      'GET /api/categories?popular=true': 'Catégories populaires',
      'POST /api/categories': 'Créer une catégorie (admin)',
      'PUT /api/categories/:id': 'Modifier une catégorie (admin)',
      'DELETE /api/categories/:id': 'Supprimer une catégorie (admin)'
    },
    '🛒 Panier': {
      'GET /api/cart': 'Obtenir son panier',
      'POST /api/cart/items': 'Ajouter un produit au panier',
      'PUT /api/cart/items/:id': 'Modifier la quantité',
      'DELETE /api/cart/items/:id': 'Retirer un produit',
      'DELETE /api/cart': 'Vider le panier'
    },
    '❤️ Favoris': {
      'GET /api/favorites': 'Lister ses favoris',
      'POST /api/favorites': 'Ajouter aux favoris',
      'DELETE /api/favorites/:id': 'Retirer des favoris'
    },
    '📦 Commandes': {
      'POST /api/orders/checkout': 'Créer une commande',
      'GET /api/orders': 'Lister ses commandes',
      'GET /api/orders/:id': 'Détails d\'une commande'
    },
    '💰 Négociations': {
      'POST /api/negotiations': 'Proposer un prix',
      'GET /api/negotiations': 'Lister ses négociations',
      'PUT /api/negotiations/:id': 'Répondre à une négociation'
    },
    '🏪 Vendeurs': {
      'POST /api/vendors/request': 'Demander à devenir vendeur',
      'GET /api/vendors': 'Lister les vendeurs actifs'
    },
    '👑 Admin': {
      'GET /api/admin/dashboard': 'Statistiques admin',
      'GET /api/admin/vendor-requests': 'Demandes vendeurs',
      'PUT /api/admin/vendors/:id/approve': 'Approuver un vendeur',
      'PUT /api/admin/vendors/:id/reject': 'Rejeter un vendeur',
      'GET /api/admin/products': 'Tous les produits',
      'DELETE /api/admin/products/:id': 'Supprimer un produit',
      'GET /api/admin/orders': 'Toutes les commandes',
      'PUT /api/admin/orders/:id/status': 'Modifier statut commande',
      'GET /api/admin/users': 'Tous les utilisateurs',
      'GET /api/admin/categories': 'Toutes les catégories',
      'POST /api/admin/categories': 'Créer une catégorie',
      'PUT /api/admin/categories/:id': 'Modifier une catégorie',
      'DELETE /api/admin/categories/:id': 'Supprimer une catégorie'
    }
  };

  res.json({
    success: true,
    message: '📚 Documentation des endpoints TYDA API',
    baseUrl: 'https://tyda-back.onrender.com',
    authentication: 'Bearer Token dans header Authorization',
    endpoints: routes,
    notes: {
      '🔒 Routes protégées': 'Nécessitent un token JWT valide',
      '👑 Routes admin': 'Nécessitent le rôle admin',
      '🏪 Routes vendeur': 'Nécessitent le rôle vendeur approuvé',
      '📱 Format téléphone': '+225XXXXXXXX (Côte d\'Ivoire)',
      '🔢 Format PIN': '4 chiffres minimum'
    }
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Routes modulaires par rôle
app.use('/api/client', clientProductsRoutes);
app.use('/api/client', clientProfileRoutes);
app.use('/api/vendor', vendorProductsRoutes);
app.use('/api/vendor', vendorProfileRoutes);
app.use('/api/vendor', vendorDashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/admin', adminRoutes);

// Gestion des erreurs
app.use(notFound);
app.use(errorHandler);

// Connexion à la base de données MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

// Middleware d'authentification JWT pour Socket.IO (handshake)
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('AUTH_REQUIRED'));
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(new Error('INVALID_TOKEN'));
    }
    const user = await User.findById(decoded.userId).select('role accountStatus vendorInfo.validationStatus');
    if (!user) return next(new Error('USER_NOT_FOUND'));
    if (user.accountStatus !== 'active') return next(new Error('ACCOUNT_INACTIVE'));
    // Attacher l'utilisateur au socket
    socket.user = { id: user._id.toString(), role: user.role, canSell: user.canSell() };
    next();
  } catch (error) {
    next(new Error('AUTH_ERROR'));
  }
});

// Gestion des connexions Socket.IO pour la négociation en temps réel (après auth)
io.on('connection', (socket) => {
  console.log('👤 Client connecté:', socket.id);

  // Rejoindre une room de négociation
  socket.on('join-negotiation', (negotiationId) => {
    if (!socket.user) {
      return socket.emit('socket-error', { message: 'Authentification requise' });
    }
    socket.join(`negotiation-${negotiationId}`);
    console.log(`🤝 Client ${socket.id} a rejoint la négociation ${negotiationId}`);
  });

  // Gérer les messages de négociation
  socket.on('negotiate-message', async (data) => {
    try {
      if (!socket.user) {
        return socket.emit('socket-error', { message: 'Authentification requise' });
      }
      console.log('📨 Message de négociation reçu:', data);
      const response = await negotiationBot.handleMessage(data);
      console.log('🤖 Réponse du bot (Socket.IO):', response);
      
      // Émettre à toute la room de négociation
      if (data.negotiationId) {
        io.to(`negotiation-${data.negotiationId}`).emit('negotiation-message', {
          message: response.message,
          proposedPrice: response.suggestedPrice || response.counterPrice || response.finalPrice,
          status: response.status,
          type: response.type
        });
      } else {
        socket.emit('bot-response', response);
      }
    } catch (error) {
      console.error('Erreur bot négociation:', error);
      socket.emit('bot-error', { message: 'Erreur lors de la négociation' });
    }
  });

  socket.on('disconnect', () => {
    console.log('👋 Client déconnecté:', socket.id);
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log('🚀 ==========================================');
    console.log(`🏪 TYDA Vente API démarré sur le port ${PORT}`);
    console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log('🟢 Couleurs de la Côte d\'Ivoire: Orange, Blanc, Vert');
    console.log('==========================================');
  });
};

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM reçu, arrêt gracieux...');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

startServer();

module.exports = { app, io };