import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, vendorApi, authApi } from '../lib/api';
import { 
  User, MapPin, Phone, Mail, Store, Loader2, Edit2, Save, X, Shield, 
  Calendar, Package, Heart, ShoppingBag, Bell, CheckCircle, XCircle, 
  Trash2, ArrowRight, Upload, FileText, Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile'); // profile, products, notifications, vendor-request
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [modal, setModal] = useState({ show: false, type: '', message: '' });
  const [vendorFormData, setVendorFormData] = useState({
    fullName: '',
    businessName: '',
    businessDescription: '',
    businessAddress: '',
    photo: null,
    identityDocument: null,
    photoPreview: null,
    identityDocumentPreview: null,
  });

  // Récupérer le profil
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await authApi.getCurrentUser();
      return response.data;
    },
  });

  // Récupérer les produits du vendeur si applicable
  const { data: vendorProducts } = useQuery({
    queryKey: ['vendor-products-profile'],
    queryFn: async () => {
      const response = await vendorApi.getProducts();
      return response.data;
    },
    enabled: profileData?.data?.user?.role === 'vendeur' && profileData?.data?.user?.vendorInfo?.validationStatus === 'approved',
  });

  const profile = profileData?.data?.user;
  const isVendor = profile?.role === 'vendeur';
  const isApprovedVendor = profile?.vendorInfo?.validationStatus === 'approved';
  const products = vendorProducts?.data?.products || [];
  const validatedProducts = products.filter(p => p.status === 'valide');

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  // Mutation pour mettre à jour le profil
  const updateProfile = useMutation({
    mutationFn: (data) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setIsEditing(false);
      setModal({ show: true, type: 'success', message: 'Profil mis à jour avec succès !' });
    },
    onError: (error) => {
      setModal({ show: true, type: 'error', message: error.response?.data?.message || 'Erreur lors de la mise à jour' });
    },
  });

  // Mutation pour supprimer une notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId) => {
      return userApi.deleteNotification(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setModal({ show: true, type: 'success', message: 'Notification supprimée' });
    },
    onError: () => {
      setModal({ show: true, type: 'error', message: 'Erreur lors de la suppression' });
    },
  });

  // Mutation pour demander le statut vendeur
  const requestVendor = useMutation({
    mutationFn: async (data) => {
      const photoBase64 = await compressAndConvertToBase64(data.photo);
      const identityDocBase64 = await compressAndConvertToBase64(data.identityDocument);
      
      return vendorApi.requestVendor({
        fullName: data.fullName,
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        businessAddress: data.businessAddress,
        photo: photoBase64,
        identityDocument: identityDocBase64,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setVendorFormData({
        fullName: '',
        businessName: '',
        businessDescription: '',
        businessAddress: '',
        photo: null,
        identityDocument: null,
        photoPreview: null,
        identityDocumentPreview: null,
      });
      setModal({ show: true, type: 'success', message: 'Demande envoyée avec succès ! Nous examinerons votre dossier.' });
      setActiveTab('profile');
    },
    onError: (error) => {
      setModal({ show: true, type: 'error', message: error.response?.data?.message || 'Erreur lors de l\'envoi de la demande' });
    },
  });

  // Fonction pour compresser une image et la convertir en base64
  const compressAndConvertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Redimensionner si l'image est trop grande (max 1920px)
          const maxDimension = 1920;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compresser à 80% de qualité
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(base64);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setModal({ show: true, type: 'error', message: 'Le fichier ne doit pas dépasser 10MB' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setModal({ show: true, type: 'error', message: 'Seules les images sont acceptées' });
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setVendorFormData(prev => ({
        ...prev,
        [fieldName]: file,
        [`${fieldName}Preview`]: previewUrl
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Profil introuvable</p>
        </div>
      </div>
    );
  }

  const notifications = profile?.notifications?.filter(n => !n.read) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                <User className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">{profile.firstName} {profile.lastName}</h1>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                    {isVendor ? '🏪 Vendeur' : '👤 Client'}
                  </span>
                  {isApprovedVendor && (
                    <span className="px-3 py-1 bg-green-500 rounded-full text-sm font-semibold">
                      ✓ Vérifié
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isApprovedVendor && (
              <button
                onClick={() => navigate('/vendor-dashboard')}
                className="flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <Store className="h-5 w-5" />
                Espace Vendeur
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-4">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-700">Navigation</h3>
              </div>
              <nav className="p-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === 'profile' 
                      ? 'bg-orange-50 text-orange-600 font-semibold' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-5 w-5" />
                  Mon profil
                </button>

                {isApprovedVendor && (
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === 'products' 
                        ? 'bg-orange-50 text-orange-600 font-semibold' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Package className="h-5 w-5" />
                    Mes produits validés
                    {validatedProducts.length > 0 && (
                      <span className="ml-auto bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                        {validatedProducts.length}
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === 'notifications' 
                      ? 'bg-orange-50 text-orange-600 font-semibold' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Bell className="h-5 w-5" />
                  Notifications
                  {notifications.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {!isVendor && (
                  <button
                    onClick={() => setActiveTab('vendor-request')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === 'vendor-request' 
                        ? 'bg-orange-50 text-orange-600 font-semibold' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Store className="h-5 w-5" />
                    Devenir vendeur
                  </button>
                )}
              </nav>

              {/* Statistiques rapides */}
              <div className="p-4 border-t mt-4">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Statistiques</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Commandes</span>
                    <span className="font-bold text-gray-900">0</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Favoris</span>
                    <span className="font-bold text-gray-900">0</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Depuis</span>
                    <span className="font-bold text-gray-900">
                      {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tab: Profil */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-md p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Informations personnelles</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-all"
                    >
                      <Edit2 className="h-4 w-4" />
                      Modifier
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <X className="h-4 w-4" />
                      Annuler
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateProfile.mutate(formData);
                    }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Le numéro ne peut pas être modifié</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Ex: Cocody, Abidjan"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={updateProfile.isPending}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {updateProfile.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          Enregistrer
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-xs text-gray-500">Nom complet</p>
                        <p className="font-semibold text-gray-900">{profile.firstName} {profile.lastName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-semibold text-gray-900">{profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <Phone className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-xs text-gray-500">Téléphone</p>
                        <p className="font-semibold text-gray-900">{profile.phone}</p>
                      </div>
                    </div>
                    {profile.address && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-xs text-gray-500">Adresse</p>
                          <p className="font-semibold text-gray-900">{profile.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Produits validés du vendeur */}
            {activeTab === 'products' && isApprovedVendor && (
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Mes produits validés</h2>
                
                {validatedProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Aucun produit validé pour le moment</p>
                    <button
                      onClick={() => navigate('/vendor/products')}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      Ajouter un produit
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {validatedProducts.map((product) => (
                      <div key={product._id} className="border border-green-200 rounded-lg overflow-hidden bg-green-50/30 hover:shadow-lg transition-all">
                        <div className="aspect-video bg-gray-100 relative">
                          {product.images?.[0]?.url ? (
                            <img
                              src={product.images[0].url}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-12 w-12 text-gray-300" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                              ✓ Validé
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
                          <p className="text-2xl font-bold text-orange-600 mb-2">
                            {product.price.toLocaleString()} FCFA
                          </p>
                          <p className="text-sm text-gray-600">
                            Stock: {product.inventory?.quantity || 0} | {product.category?.name}
                          </p>
                          {product.negotiation?.enabled && (
                            <div className="mt-2 px-3 py-1 bg-green-100 border border-green-300 text-green-700 rounded-full text-xs font-semibold inline-block">
                              ✨ Négociable -{product.negotiation.percentage}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Notifications */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h2>
                
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Aucune notification</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notif) => {
                      const isApproval = notif.type?.includes('approved');
                      const isRejection = notif.type?.includes('rejected');
                      
                      return (
                        <div
                          key={notif._id}
                          className={`p-6 rounded-lg border-2 ${
                            isApproval ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${isApproval ? 'bg-green-100' : 'bg-red-100'}`}>
                              {isApproval ? (
                                <CheckCircle className="h-6 w-6 text-green-600" />
                              ) : (
                                <XCircle className="h-6 w-6 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className={`font-bold text-lg mb-2 ${isApproval ? 'text-green-800' : 'text-red-800'}`}>
                                {notif.title}
                              </h3>
                              <p className="text-gray-700 mb-2">{notif.message}</p>
                              
                              {notif.data?.rejectionReason && (
                                <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-200">
                                  <p className="text-sm font-semibold text-red-800">Motif :</p>
                                  <p className="text-sm text-red-700">{notif.data.rejectionReason}</p>
                                </div>
                              )}
                              
                              {notif.data?.productTitle && (
                                <p className="text-sm text-gray-600 mt-2">
                                  Produit : <span className="font-semibold">{notif.data.productTitle}</span>
                                </p>
                              )}
                              
                              {notif.data?.negotiationEnabled && (
                                <div className="mt-2 px-3 py-1 bg-green-100 border border-green-300 text-green-700 rounded text-sm inline-block">
                                  ✨ Négociation {notif.data.negotiationPercentage}%
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between mt-4">
                                <p className="text-xs text-gray-500">
                                  {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                <button
                                  onClick={() => deleteNotification.mutate(notif._id)}
                                  disabled={deleteNotification.isPending}
                                  className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Demande vendeur */}
            {activeTab === 'vendor-request' && !isVendor && (
              <div className="bg-white rounded-xl shadow-md p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Devenez vendeur sur TYDA</h2>
                  <p className="text-gray-600">
                    Rejoignez notre communauté de vendeurs et commencez à vendre vos produits dès aujourd'hui.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!vendorFormData.fullName || !vendorFormData.businessName || 
                        !vendorFormData.businessDescription || !vendorFormData.businessAddress ||
                        !vendorFormData.photo || !vendorFormData.identityDocument) {
                      setModal({ show: true, type: 'error', message: 'Tous les champs sont requis' });
                      return;
                    }
                    requestVendor.mutate(vendorFormData);
                  }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                    <input
                      type="text"
                      value={vendorFormData.fullName}
                      onChange={(e) => setVendorFormData({...vendorFormData, fullName: e.target.value})}
                      placeholder="Ex: Jean Kouassi"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise *</label>
                    <input
                      type="text"
                      value={vendorFormData.businessName}
                      onChange={(e) => setVendorFormData({...vendorFormData, businessName: e.target.value})}
                      placeholder="Ex: Boutique Kouassi"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description de l'activité *</label>
                    <textarea
                      value={vendorFormData.businessDescription}
                      onChange={(e) => setVendorFormData({...vendorFormData, businessDescription: e.target.value})}
                      placeholder="Décrivez votre activité..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse de l'entreprise *</label>
                    <input
                      type="text"
                      value={vendorFormData.businessAddress}
                      onChange={(e) => setVendorFormData({...vendorFormData, businessAddress: e.target.value})}
                      placeholder="Ex: Cocody, Abidjan"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Photo de profil *</label>
                      <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                        {vendorFormData.photoPreview ? (
                          <img src={vendorFormData.photoPreview} alt="Preview" className="h-full object-cover rounded-lg" />
                        ) : (
                          <>
                            <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Cliquez pour uploader</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'photo')}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pièce d'identité *</label>
                      <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                        {vendorFormData.identityDocumentPreview ? (
                          <img src={vendorFormData.identityDocumentPreview} alt="Preview" className="h-full object-cover rounded-lg" />
                        ) : (
                          <>
                            <FileText className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Cliquez pour uploader</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'identityDocument')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={requestVendor.isPending}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {requestVendor.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Store className="h-5 w-5" />
                        Envoyer la demande
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de notification */}
      {modal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className={`p-6 rounded-t-xl ${modal.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-3">
                {modal.type === 'success' ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
                <h3 className={`text-xl font-bold ${modal.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                  {modal.type === 'success' ? 'Succès !' : 'Erreur'}
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">{modal.message}</p>
              <button
                onClick={() => setModal({ show: false, type: '', message: '' })}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  modal.type === 'success'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
