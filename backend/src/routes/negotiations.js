const express = require('express');
const Negotiation = require('../models/Negotiation');
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');
const { validateInput, validateObjectId } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const NegotiationBot = require('../services/negotiationBot');

const router = express.Router();

/**
 * @route   POST /api/negotiations
 * @desc    Créer une nouvelle négociation (simple)
 * @access  Private
 */
router.post('/', auth, asyncHandler(async (req, res) => {
  const { productId, proposedPrice } = req.body;

  if (!productId || !proposedPrice) {
    return res.status(400).json({
      success: false,
      message: 'ID produit et prix proposé requis'
    });
  }

  const product = await Product.findById(productId);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Produit introuvable'
    });
  }

  if (!product.negotiation?.enabled) {
    return res.status(400).json({
      success: false,
      message: 'Ce produit n\'est pas négociable'
    });
  }

  const userId = req.user.userId || req.user._id;

  const negotiation = await Negotiation.create({
    product: productId,
    customer: userId,
    vendor: product.vendor,
    originalPrice: product.price,
    proposedPrice: parseFloat(proposedPrice),
    currentPrice: product.price,
    status: 'pending',
    messages: [{
      sender: userId,
      senderType: 'customer',
      content: `Je propose ${proposedPrice} FCFA pour ce produit`,
      timestamp: new Date()
    }]
  });

  res.status(201).json({
    success: true,
    message: 'Négociation créée avec succès',
    data: negotiation
  });
}));

/**
 * @route   POST /api/negotiations/start
 * @desc    Démarrer une nouvelle négociation
 * @access  Private (Client)
 */
router.post('/start', [
  auth,
  authorize('client')
], asyncHandler(async (req, res) => {
  const { productId, sessionId } = req.body;

  if (!productId || !sessionId) {
    return res.status(400).json({
      success: false,
      message: 'ID produit et session requis'
    });
  }

  // Vérifier le produit
  const product = await Product.findById(productId).populate('vendor');
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Produit introuvable'
    });
  }

  if (!product.isNegotiable) {
    return res.status(400).json({
      success: false,
      message: 'Ce produit n\'est pas éligible à la négociation',
      reasons: [
        product.price < (process.env.MIN_NEGOTIATION_AMOUNT || 5000) ? 'Prix trop bas' : null,
        !product.negotiation?.enabled ? 'Négociation désactivée' : null,
        product.status !== 'valide' ? 'Produit non validé' : null
      ].filter(Boolean)
    });
  }

  // Vérifier s'il y a déjà une négociation active
  const existingNegotiation = await Negotiation.findOne({
    product: productId,
    customer: req.user.userId,
    status: 'en_cours'
  });

  if (existingNegotiation) {
    return res.json({
      success: true,
      message: 'Négociation existante trouvée',
      data: { 
        negotiation: existingNegotiation,
        alreadyExists: true
      }
    });
  }

  // Créer une nouvelle négociation
  const negotiation = new Negotiation({
    product: productId,
    customer: req.user.userId,
    vendor: product.vendor._id,
    originalPrice: product.price,
    proposedPrice: product.price,
    sessionId,
    botData: {
      strategy: 'moderate',
      minAcceptablePrice: product.minNegotiationPrice,
      maxDiscount: product.negotiation.percentage
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  await negotiation.save();

  // Incrémenter le compteur de demandes de négociation
  await Product.findByIdAndUpdate(productId, {
    $inc: { 'stats.negotiationRequests': 1 }
  });

  // Message d'accueil du bot
  const welcomeMessage = `Bonjour ! Je suis TYDA Bot, votre assistant négociation. Ce produit coûte ${negotiation.originalPrice.toLocaleString()} FCFA. Quel prix souhaitez-vous proposer ?`;
  
  await negotiation.addMessage('bot', welcomeMessage, null, null);

  res.status(201).json({
    success: true,
    message: 'Négociation démarrée avec succès',
    data: {
      negotiation: {
        id: negotiation._id,
        originalPrice: negotiation.originalPrice,
        minPrice: product.minNegotiationPrice,
        maxAttempts: negotiation.maxAttempts,
        currentAttempts: negotiation.attempts,
        status: negotiation.status,
        messages: negotiation.messages,
        expiresAt: negotiation.expiresAt
      }
    }
  });
}));

/**
 * @route   POST /api/negotiations/:id/propose
 * @desc    Proposer un prix dans une négociation
 * @access  Private (Client propriétaire)
 */
router.post('/:id/propose', [
  auth,
  authorize('client'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const { proposedPrice, message } = req.body;
  const negotiationId = req.params.id;

  if (!proposedPrice || proposedPrice <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Prix proposé invalide'
    });
  }

  // Récupérer la négociation
  const negotiation = await Negotiation.findById(negotiationId)
    .populate('product')
    .populate('customer', 'firstName lastName');

  if (!negotiation) {
    return res.status(404).json({
      success: false,
      message: 'Négociation introuvable'
    });
  }

  // Vérifier la propriété
  if (negotiation.customer._id.toString() !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé à cette négociation'
    });
  }

  // Vérifier le statut
  if (!negotiation.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Cette négociation n\'est plus active',
      status: negotiation.status
    });
  }

  // Simuler un bot intelligent
  const bot = new NegotiationBot();
  
  try {
    // Ajouter le message du client
    await negotiation.addMessage('customer', message || `Je propose ${proposedPrice} FCFA`, proposedPrice);
    
    // Traiter la proposition avec le bot
    const botResponse = await bot.processPriceProposal(negotiation, proposedPrice);
    
    // Ajouter la réponse du bot
    await negotiation.addMessage('bot', botResponse.message, botResponse.counterPrice, botResponse.type);

    // Récupérer la négociation mise à jour
    const updatedNegotiation = await Negotiation.findById(negotiationId)
      .populate('product', 'title images')
      .lean();

    res.json({
      success: true,
      data: {
        negotiation: updatedNegotiation,
        botResponse
      }
    });

  } catch (error) {
    console.error('Erreur négociation:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement de la négociation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * @route   GET /api/negotiations/:id
 * @desc    Obtenir les détails d'une négociation
 * @access  Private (Propriétaire, Vendeur ou Admin)
 */
router.get('/:id', [
  auth,
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const negotiation = await Negotiation.findById(req.params.id)
    .populate('product', 'title images price')
    .populate('customer', 'firstName lastName avatar')
    .populate('vendor', 'firstName lastName vendorInfo.businessName')
    .lean();

  if (!negotiation) {
    return res.status(404).json({
      success: false,
      message: 'Négociation introuvable'
    });
  }

  // Vérifier les droits d'accès
  const hasAccess = 
    req.user.role === 'admin' ||
    req.user.userId === negotiation.customer._id.toString() ||
    req.user.userId === negotiation.vendor._id.toString();

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé à cette négociation'
    });
  }

  res.json({
    success: true,
    data: { negotiation }
  });
}));

/**
 * @route   GET /api/negotiations
 * @desc    Obtenir les négociations de l'utilisateur
 * @access  Private
 */
router.get('/', [
  auth
], asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  // Construire la requête selon le rôle
  let query = {};
  
  if (req.user.role === 'client') {
    query.customer = req.user.userId;
  } else if (req.user.role === 'vendeur') {
    query.vendor = req.user.userId;
  } else if (req.user.role === 'admin') {
    // Admin peut voir toutes les négociations
  } else {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé'
    });
  }

  if (status) {
    query.status = status;
  }

  const [negotiations, total] = await Promise.all([
    Negotiation.find(query)
      .populate('product', 'title images price')
      .populate('customer', 'firstName lastName')
      .populate('vendor', 'firstName lastName vendorInfo.businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Negotiation.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      negotiations,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        count: negotiations.length,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: parseInt(limit)
      }
    }
  });
}));

/**
 * @route   POST /api/negotiations/:id/accept
 * @desc    Accepter une négociation (vendeur ou bot)
 * @access  Private (Vendeur ou Admin)
 */
router.post('/:id/accept', [
  auth,
  authorize('vendeur', 'admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const { finalPrice } = req.body;
  const negotiationId = req.params.id;

  const negotiation = await Negotiation.findById(negotiationId)
    .populate('product');

  if (!negotiation) {
    return res.status(404).json({
      success: false,
      message: 'Négociation introuvable'
    });
  }

  // Vérifier les droits
  if (req.user.role === 'vendeur' && negotiation.vendor.toString() !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé à cette négociation'
    });
  }

  if (negotiation.status !== 'en_cours') {
    return res.status(400).json({
      success: false,
      message: 'Cette négociation n\'est plus active'
    });
  }

  // Accepter la négociation
  await negotiation.accept(finalPrice || negotiation.proposedPrice);

  // Mettre à jour les statistiques du produit
  await Product.findByIdAndUpdate(negotiation.product._id, {
    $inc: { 'stats.successfulNegotiations': 1 }
  });

  res.json({
    success: true,
    message: 'Négociation acceptée avec succès',
    data: { negotiation }
  });
}));

/**
 * @route   POST /api/negotiations/:id/reject
 * @desc    Refuser une négociation
 * @access  Private (Vendeur ou Admin)
 */
router.post('/:id/reject', [
  auth,
  authorize('vendeur', 'admin'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const negotiationId = req.params.id;

  const negotiation = await Negotiation.findById(negotiationId);

  if (!negotiation) {
    return res.status(404).json({
      success: false,
      message: 'Négociation introuvable'
    });
  }

  // Vérifier les droits
  if (req.user.role === 'vendeur' && negotiation.vendor.toString() !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé à cette négociation'
    });
  }

  if (negotiation.status !== 'en_cours') {
    return res.status(400).json({
      success: false,
      message: 'Cette négociation n\'est plus active'
    });
  }

  await negotiation.reject(reason || 'Refusée par le vendeur');

  res.json({
    success: true,
    message: 'Négociation refusée',
    data: { negotiation }
  });
}));

/**
 * @route   POST /api/negotiations/:id/add-to-cart
 * @desc    Ajouter au panier après négociation acceptée
 * @access  Private (Client propriétaire)
 */
router.post('/:id/add-to-cart', [
  auth,
  authorize('client'),
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const negotiation = await Negotiation.findById(req.params.id);

  if (!negotiation) {
    return res.status(404).json({
      success: false,
      message: 'Négociation introuvable'
    });
  }

  if (negotiation.customer.toString() !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé à cette négociation'
    });
  }

  if (negotiation.status !== 'acceptee') {
    return res.status(400).json({
      success: false,
      message: 'La négociation doit être acceptée pour ajouter au panier'
    });
  }

  if (negotiation.addedToCart) {
    return res.status(400).json({
      success: false,
      message: 'Produit déjà ajouté au panier'
    });
  }

  try {
    const cart = await negotiation.addToCart();
    
    res.json({
      success: true,
      message: 'Produit ajouté au panier avec le prix négocié',
      data: { 
        negotiation: {
          id: negotiation._id,
          finalPrice: negotiation.finalPrice,
          addedToCart: true
        },
        cartItemsCount: cart.items.length
      }
    });

  } catch (error) {
    console.error('Erreur ajout panier:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'ajout au panier'
    });
  }
}));

/**
 * @route   GET /api/negotiations/stats
 * @desc    Obtenir les statistiques de négociation
 * @access  Private (Vendeur pour ses produits, Admin pour tout)
 */
router.get('/stats', [
  auth,
  authorize('vendeur', 'admin')
], asyncHandler(async (req, res) => {
  let filter = {};
  
  if (req.user.role === 'vendeur') {
    filter.vendor = req.user.userId;
  }

  const stats = await Negotiation.getStats(filter);

  // Statistiques supplémentaires
  const additionalStats = await Negotiation.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgSavings: { $avg: '$savingsPercentage' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats,
      byStatus: additionalStats
    }
  });
}));

/**
 * @route   DELETE /api/negotiations/cleanup
 * @desc    Nettoyer les négociations expirées (tâche admin)
 * @access  Private (Admin seulement)
 */
router.delete('/cleanup', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  const cleanupCount = await Negotiation.cleanupExpired();

  res.json({
    success: true,
    message: `${cleanupCount} négociations expirées nettoyées`,
    data: { cleanupCount }
  });
}));

module.exports = router;