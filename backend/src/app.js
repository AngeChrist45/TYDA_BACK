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
const adminRoutes = require('./modules/admin/routes/admin');
// Modules séparés par rôle
const clientProductsRoutes = require('./modules/client/routes/products');
const clientProfileRoutes = require('./modules/client/routes/profile');
const vendorProductsRoutes = require('./modules/vendor/routes/products');
const vendorProfileRoutes = require('./modules/vendor/routes/profile');

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
    origin: [
      process.env.FRONTEND_WEB_URL || 'http://localhost:3000',
      process.env.FRONTEND_MOBILE_URL || 'http://localhost:19006'
    ],
    methods: ['GET', 'POST']
  }
});

// Initialisation du bot de négociation avec Socket.IO
const negotiationBot = new NegotiationBot(io);

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
app.use(cors({
  origin: [
    process.env.FRONTEND_WEB_URL || 'http://localhost:3000',
    process.env.FRONTEND_MOBILE_URL || 'http://localhost:19006'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'TYDA Vente API est fonctionnel',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/negotiations', negotiationRoutes);
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
      const response = await negotiationBot.handleMessage(data);
      socket.emit('bot-response', response);
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