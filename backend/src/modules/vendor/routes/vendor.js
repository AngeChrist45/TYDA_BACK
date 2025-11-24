const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth');
const Product = require('../../../models/Product');
const Order = require('../../../models/Order');
const User = require('../../../models/User');

// Middleware pour vérifier que l'utilisateur est un vendeur approuvé
const isApprovedVendor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (!user.vendorInfo || user.vendorInfo.validationStatus !== 'approved') {
      return res.status(403).json({ 
        message: 'Accès refusé. Vous devez être un vendeur approuvé.' 
      });
    }

    req.vendor = user;
    next();
  } catch (error) {
    console.error('Erreur middleware vendeur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/vendor/dashboard - Statistiques du vendeur
router.get('/dashboard', auth, isApprovedVendor, async (req, res) => {
  try {
    const vendorId = req.user.userId;

    // Compter les produits du vendeur
    const totalProducts = await Product.countDocuments({ vendor: vendorId });

    // Compter les commandes
    const orders = await Order.find({ 'items.vendor': vendorId });
    const totalOrders = orders.length;
    
    // Commandes en attente (gérées par admin)
    const pendingOrders = orders.filter(order => 
      order.status === 'pending' || order.status === 'confirmed'
    ).length;

    // Calculer le revenu total
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    orders.forEach(order => {
      if (order.status === 'delivered') {
        const orderTotal = order.items
          .filter(item => item.vendor?.toString() === vendorId)
          .reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        totalRevenue += orderTotal;

        // Revenu du mois en cours
        const orderDate = new Date(order.createdAt);
        if (orderDate.getMonth() === currentMonth && 
            orderDate.getFullYear() === currentYear) {
          monthlyRevenue += orderTotal;
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        monthlyRevenue,
        businessInfo: {
          businessName: req.vendor.vendorInfo.businessName,
          businessDescription: req.vendor.vendorInfo.businessDescription,
          businessAddress: req.vendor.vendorInfo.businessAddress,
        }
      }
    });
  } catch (error) {
    console.error('Erreur dashboard vendeur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

// GET /api/vendor/products - Liste des produits du vendeur
router.get('/products', auth, isApprovedVendor, async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user.userId })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Erreur récupération produits vendeur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des produits' 
    });
  }
});

// GET /api/vendor/orders - Commandes du vendeur (historique)
router.get('/orders', auth, isApprovedVendor, async (req, res) => {
  try {
    const vendorId = req.user.userId;

    // Trouver toutes les commandes contenant au moins un produit du vendeur
    const orders = await Order.find({ 'items.vendor': vendorId })
      .populate('user', 'firstName lastName phone')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    // Filtrer les items pour ne garder que ceux du vendeur
    const vendorOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      client: order.user,
      items: order.items.filter(item => 
        item.vendor?.toString() === vendorId
      ),
      totalAmount: order.items
        .filter(item => item.vendor?.toString() === vendorId)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }));

    res.json({
      success: true,
      data: { orders: vendorOrders }
    });
  } catch (error) {
    console.error('Erreur récupération commandes vendeur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des commandes' 
    });
  }
});

// GET /api/vendor/notifications - Notifications du vendeur
router.get('/notifications', auth, isApprovedVendor, async (req, res) => {
  try {
    const vendor = await User.findById(req.user.userId);
    
    // Filtrer les notifications liées aux commandes
    const orderNotifications = vendor.notifications.filter(notif => 
      notif.type === 'order_received' || 
      notif.type === 'order_status_update'
    );

    res.json({
      success: true,
      data: { notifications: orderNotifications }
    });
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des notifications' 
    });
  }
});

// PUT /api/vendor/notifications/:id/read - Marquer une notification comme lue
router.put('/notifications/:id/read', auth, isApprovedVendor, async (req, res) => {
  try {
    const vendor = await User.findById(req.user.userId);
    const notification = vendor.notifications.id(req.params.id);

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: 'Notification non trouvée' 
      });
    }

    notification.read = true;
    await vendor.save();

    res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });
  } catch (error) {
    console.error('Erreur mise à jour notification:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la mise à jour de la notification' 
    });
  }
});

module.exports = router;
