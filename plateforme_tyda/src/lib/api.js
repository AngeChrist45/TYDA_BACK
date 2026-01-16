import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://tyda-back.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tyda_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log(' Requête API:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    data: config.data,
    hasToken: !!token
  });

  return config;
});

// Intercepteur pour gérer les erreurs de timeout Render
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Log détaillé des erreurs
    if (error.response) {
      console.error(' Erreur API:', {
        status: error.response.status,
        message: error.response.data?.message || error.response.data?.error,
        code: error.response.data?.code,
        url: originalRequest.url,
        method: originalRequest.method,
        data: originalRequest.data
      });
    }

    // Si timeout ou erreur réseau et première tentative, réessayer une fois
    if (
      (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      console.log(' Réveil du serveur Render en cours...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (phone, code) => api.post('/auth/verify-otp', { phone, otpCode: code }),
  setPin: (data) => api.post('/auth/set-pin', data),
  login: (data) => api.post('/auth/login', data),
  requestOTP: (phone) => api.post('/auth/request-otp', { phone }),
  resetPin: (data) => api.post('/auth/reset-pin', data),
  changePin: (data) => api.post('/auth/change-pin', data),
  getCurrentUser: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),
};

export const productsApi = {
  getAll: (params) => api.get('/client/products', { params }),
  getById: (id) => api.get(`/client/products/${id}`),
  getNegotiable: () => api.get('/client/products?negotiable=true'),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
};

export const cartApi = {
  get: () => api.get('/cart'),
  add: (productId, quantity, negotiatedPrice = null) => {
    const data = { productId, quantity };
    if (negotiatedPrice) {
      data.negotiatedPrice = negotiatedPrice;
    }
    return api.post('/cart/items', data);
  },
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
  create: (data) => api.post('/orders/checkout', data),
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
  getDashboard: () => api.get('/vendor/dashboard'),
  getProducts: () => api.get('/vendor/products/mine'),
  getOrders: () => api.get('/vendor/orders'),
  getNotifications: () => api.get('/vendor/notifications'),
  markNotificationAsRead: (id) => api.put(`/vendor/notifications/${id}/read`),

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
  deleteNotification: (notificationId) => api.delete(`/users/notifications/${notificationId}`),
};

export default api;
