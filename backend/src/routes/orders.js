const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { validateInput, validateObjectId } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/orders/cart
 * @desc    Obtenir le panier de l'utilisateur
 * @access  Private
 */
router.get('/cart', auth, asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.userId })
    .populate({
      path: 'items.product',
      select: 'title price images inventory.quantity status',
      populate: {
        path: 'vendor',
        select: 'firstName lastName vendorInfo.businessName'
      }
    })
    .populate('items.negotiationId', 'finalPrice status');

  if (!cart) {
    cart = new Cart({ user: req.user.userId, items: [] });
    await cart.save();
  }

  // Vérifier la disponibilité des produits
  const unavailableItems = [];
  cart.items = cart.items.filter(item => {
    if (!item.product || item.product.status !== 'valide' || 
        item.product.inventory.quantity < item.quantity) {
      unavailableItems.push(item);
      return false;
    }
    return true;
  });

  if (unavailableItems.length > 0) {
    await cart.save();
  }

  res.json({
    success: true,
    data: {
      cart,
      unavailableItems: unavailableItems.length,
      summary: {
        itemCount: cart.itemCount,
        subtotal: cart.total,
        total: cart.total // TODO: Ajouter frais de livraison, taxes
      }
    }
  });
}));

/**
 * @route   POST /api/orders/cart/add
 * @desc    Ajouter un produit au panier
 * @access  Private
 */
router.post('/cart/add', [
  auth,
  authorize('client', 'vendeur')
], asyncHandler(async (req, res) => {
  const { productId, quantity = 1, negotiationId } = req.body;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'ID produit requis'
    });
  }

  const Product = require('../models/Product');
  const product = await Product.findById(productId)
    .populate('vendor', 'firstName lastName vendorInfo.businessName');

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Produit introuvable'
    });
  }

  if (product.status !== 'valide') {
    return res.status(400).json({
      success: false,
      message: 'Ce produit n\'est pas disponible'
    });
  }

  if (product.inventory.quantity < quantity) {
    return res.status(400).json({
      success: false,
      message: 'Stock insuffisant',
      available: product.inventory.quantity
    });
  }

  // Récupérer ou créer le panier
  let cart = await Cart.findOne({ user: req.user.userId });
  if (!cart) {
    cart = new Cart({ user: req.user.userId, items: [] });
  }

  // Vérifier le prix négocié si applicable
  let finalPrice = product.price;
  if (negotiationId) {
    const Negotiation = require('../models/Negotiation');
    const negotiation = await Negotiation.findById(negotiationId);
    
    if (negotiation && negotiation.status === 'acceptee' && 
        negotiation.customer.toString() === req.user.userId &&
        negotiation.product.toString() === productId) {
      finalPrice = negotiation.finalPrice;
    }
  }

  // Vérifier si le produit est déjà dans le panier
  const existingItemIndex = cart.items.findIndex(item => 
    item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    // Mettre à jour la quantité
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    if (newQuantity > product.inventory.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Quantité totale dépasse le stock disponible',
        maxQuantity: product.inventory.quantity,
        currentInCart: cart.items[existingItemIndex].quantity
      });
    }

    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = finalPrice;
    if (negotiationId) {
      cart.items[existingItemIndex].negotiatedPrice = finalPrice;
      cart.items[existingItemIndex].negotiationId = negotiationId;
    }
  } else {
    // Ajouter nouveau produit
    const newItem = {
      product: productId,
      quantity,
      price: finalPrice
    };

    if (negotiationId) {
      newItem.negotiatedPrice = finalPrice;
      newItem.negotiationId = negotiationId;
    }

    cart.items.push(newItem);
  }

  await cart.save();
  
  await cart.populate({
    path: 'items.product',
    select: 'title price images',
    populate: {
      path: 'vendor',
      select: 'firstName lastName vendorInfo.businessName'
    }
  });

  res.json({
    success: true,
    message: 'Produit ajouté au panier',
    data: {
      cart,
      summary: {
        itemCount: cart.itemCount,
        total: cart.total
      }
    }
  });
}));

/**
 * @route   PUT /api/orders/cart/update
 * @desc    Mettre à jour la quantité d'un produit dans le panier
 * @access  Private
 */
router.put('/cart/update', [
  auth,
  authorize('client', 'vendeur')
], asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || quantity < 0) {
    return res.status(400).json({
      success: false,
      message: 'ID produit et quantité valide requis'
    });
  }

  const cart = await Cart.findOne({ user: req.user.userId });

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Panier introuvable'
    });
  }

  const itemIndex = cart.items.findIndex(item => 
    item.product.toString() === productId
  );

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Produit non trouvé dans le panier'
    });
  }

  if (quantity === 0) {
    // Supprimer l'article
    cart.items.splice(itemIndex, 1);
  } else {
    // Vérifier le stock
    const Product = require('../models/Product');
    const product = await Product.findById(productId);
    
    if (quantity > product.inventory.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuffisant',
        available: product.inventory.quantity
      });
    }

    cart.items[itemIndex].quantity = quantity;
  }

  await cart.save();

  res.json({
    success: true,
    message: quantity === 0 ? 'Produit supprimé du panier' : 'Quantité mise à jour',
    data: {
      summary: {
        itemCount: cart.itemCount,
        total: cart.total
      }
    }
  });
}));

/**
 * @route   DELETE /api/orders/cart/clear
 * @desc    Vider le panier
 * @access  Private
 */
router.delete('/cart/clear', [
  auth,
  authorize('client', 'vendeur')
], asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user.userId },
    { items: [] },
    { new: true, upsert: true }
  );

  res.json({
    success: true,
    message: 'Panier vidé'
  });
}));

/**
 * @route   POST /api/orders/checkout
 * @desc    Passer une commande
 * @access  Private
 */
router.post('/checkout', [
  auth,
  authorize('client', 'vendeur')
], asyncHandler(async (req, res) => {
  console.log('📦 Checkout request body:', JSON.stringify(req.body, null, 2));
  
  const { shippingAddress, paymentMethod, notes } = req.body;

  if (!shippingAddress || !paymentMethod) {
    console.log('❌ Missing shippingAddress or paymentMethod');
    return res.status(400).json({
      success: false,
      message: 'Adresse de livraison et méthode de paiement requises'
    });
  }

  // Validation détaillée de l'adresse de livraison
  if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.phone) {
    console.log('❌ Incomplete shippingAddress:', shippingAddress);
    return res.status(400).json({
      success: false,
      message: 'Adresse complète requise (adresse, ville et téléphone)'
    });
  }

  const cart = await Cart.findOne({ user: req.user.userId })
    .populate('items.product');

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Panier vide'
    });
  }

  // Vérifier la disponibilité et préparer les articles
  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const product = cartItem.product;
    
    if (product.status !== 'valide') {
      return res.status(400).json({
        success: false,
        message: `Le produit "${product.title}" n'est plus disponible`
      });
    }

    if (product.inventory.quantity < cartItem.quantity) {
      return res.status(400).json({
        success: false,
        message: `Stock insuffisant pour "${product.title}"`,
        available: product.inventory.quantity,
        requested: cartItem.quantity
      });
    }

    const price = cartItem.negotiatedPrice || cartItem.price;
    const itemTotal = price * cartItem.quantity;
    subtotal += itemTotal;

    orderItems.push({
      product: product._id,
      vendor: product.vendor,
      quantity: cartItem.quantity,
      price: cartItem.price,
      negotiatedPrice: cartItem.negotiatedPrice,
      negotiationId: cartItem.negotiationId
    });
  }

  // Calculer les totaux
  const shipping = 0; // TODO: Calculer frais de livraison
  const tax = 0; // TODO: Calculer taxes
  const discount = 0; // TODO: Appliquer remises
  const total = subtotal + shipping + tax - discount;

  // Créer la commande
  const order = new Order({
    customer: req.user.userId,
    items: orderItems,
    totals: {
      subtotal,
      shipping,
      tax,
      discount,
      total
    },
    shippingAddress,
    paymentMethod,
    notes,
    statusHistory: [{
      status: 'en_attente',
      note: 'Commande créée',
      timestamp: new Date()
    }]
  });

  await order.save();

  // Réserver le stock
  for (const item of orderItems) {
    const Product = require('../models/Product');
    await Product.findByIdAndUpdate(item.product, {
      $inc: { 'inventory.reserved': item.quantity }
    });
  }

  // Vider le panier
  cart.items = [];
  await cart.save();

  await order.populate([
    { path: 'items.product', select: 'title images' },
    { path: 'items.vendor', select: 'firstName lastName vendorInfo.businessName' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Commande créée avec succès',
    data: { order }
  });
}));

/**
 * @route   GET /api/orders
 * @desc    Obtenir les commandes de l'utilisateur
 * @access  Private
 */
router.get('/', auth, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  let query = {};
  
  if (req.user.role === 'client') {
    query.customer = req.user.userId;
  } else if (req.user.role === 'vendeur') {
    query['items.vendor'] = req.user.userId;
  } else if (req.user.role === 'admin') {
    // Admin peut voir toutes les commandes
  } else {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé'
    });
  }

  if (status) {
    query.status = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('customer', 'firstName lastName')
      .populate('items.product', 'title images')
      .populate('items.vendor', 'firstName lastName vendorInfo.businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Order.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        count: orders.length,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: parseInt(limit)
      }
    }
  });
}));

/**
 * @route   GET /api/orders/:id
 * @desc    Obtenir une commande par ID
 * @access  Private
 */
router.get('/:id', [
  auth,
  validateObjectId('id')
], asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'firstName lastName email phone')
    .populate('items.product', 'title images price')
    .populate('items.vendor', 'firstName lastName vendorInfo.businessName')
    .populate('statusHistory.updatedBy', 'firstName lastName');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Commande introuvable'
    });
  }

  // Vérifier les droits d'accès
  const hasAccess = 
    req.user.role === 'admin' ||
    req.user.userId === order.customer._id.toString() ||
    order.items.some(item => item.vendor.toString() === req.user.userId);

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé à cette commande'
    });
  }

  res.json({
    success: true,
    data: { order }
  });
}));

module.exports = router;