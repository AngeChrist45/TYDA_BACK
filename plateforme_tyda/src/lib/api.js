import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://tyda-back.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 secondes pour laisser Render se réveiller
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tyda_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs de timeout Render
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si timeout ou erreur réseau et première tentative, réessayer une fois
    if (
      (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      console.log('⏳ Réveil du serveur Render en cours...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre 3s
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

export const authApi = {
  // Inscription: étape 1 - créer utilisateur et envoyer OTP
  register: (data) => api.post('/auth/register', data),
  // Vérifier le code OTP: étape 2
  verifyOTP: (phone, code) => api.post('/auth/verify-otp', { phone, otpCode: code }),
  // Définir le PIN: étape 3 (finaliser inscription)
  setPin: (data) => api.post('/auth/set-pin', data),
  // Connexion avec téléphone + PIN
  login: (data) => api.post('/auth/login', data),
  // Demander un OTP (réinitialisation)
  requestOTP: (phone) => api.post('/auth/request-otp', { phone }),
  // Réinitialiser le PIN
  resetPin: (data) => api.post('/auth/reset-pin', data),
  // Changer le PIN (authentifié)
  changePin: (data) => api.post('/auth/change-pin', data),
  // Obtenir l'utilisateur connecté
  getCurrentUser: () => api.get('/auth/me'),
  // Déconnexion
  logout: () => api.post('/auth/logout'),
};

export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getNegotiable: () => api.get('/products?negotiable=true'),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
};

export const cartApi = {
  get: () => api.get('/cart'),
  add: (productId, quantity) => api.post('/cart/items', { productId, quantity }),
  update: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }),
  remove: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
};

export const favoritesApi = {
  getAll: () => api.get('/favorites'),
  add: (productId) => api.post('/favorites', { productId }),
  remove: (productId) => api.delete(`/favorites/${productId}`),
};

export const ordersApi = {
  create: (data) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
};

export const negotiationsApi = {
  create: (productId, proposedPrice) => api.post('/negotiations', { productId, proposedPrice }),
  getAll: () => api.get('/negotiations'),
  respond: (id, action, counterOffer) => api.put(`/negotiations/${id}`, { action, counterOffer }),
};

export const vendorApi = {
  requestVendor: (data) => api.post('/vendors/request', data),
  // Dashboard vendeur
  getDashboard: () => api.get('/vendor/dashboard'),
  getProducts: () => api.get('/vendor/products/mine'),
  getOrders: () => api.get('/vendor/orders'),
  getNotifications: () => api.get('/vendor/notifications'),
  markNotificationAsRead: (id) => api.put(`/vendor/notifications/${id}/read`),
  // Gestion produits
  createProduct: (data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('price', data.price);
    formData.append('category', data.category);
    formData.append('inventory', JSON.stringify({ quantity: data.quantity, trackInventory: true }));
    
    if (data.images && data.images.length > 0) {
      data.images.forEach(file => formData.append('images', file));
    }
    
    return api.post('/vendor/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateProduct: (id, data) => {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.price) formData.append('price', data.price);
    if (data.category) formData.append('category', data.category);
    if (data.quantity) formData.append('inventory', JSON.stringify({ quantity: data.quantity }));
    if (data.images && data.images.length > 0) {
      data.images.forEach(file => formData.append('images', file));
    }
    return api.put(`/vendor/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteProduct: (id) => api.delete(`/vendor/products/${id}`),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAddress: (data) => api.put('/users/address', data),
};

export default api;
