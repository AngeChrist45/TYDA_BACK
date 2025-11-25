import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, vendorApi, authApi } from '../lib/api';
import { 
  User, MapPin, Phone, Mail, Store, Loader2, Edit2, Save, X, Shield, 
  Calendar, Package, TrendingUp, Award, Heart, ShoppingBag, CreditCard, Upload, Image, FileText, Bell, CheckCircle, XCircle, ArrowRightLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showVendorRequest, setShowVendorRequest] = useState(false);
  const [formData, setFormData] = useState({});
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });
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

  const { data: profileData, isLoading, isError, error } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await authApi.getCurrentUser();
      console.log('🔍 Raw API Response:', response);
      return response.data; // Retourner seulement response.data au lieu de la réponse complète
    },
    retry: 2,
  });

  useEffect(() => {
    console.log('🔍 Profile Query State:', { 
      profileData, 
      isLoading, 
      isError, 
      error,
      user: profileData?.data?.user 
    });
    console.log('📦 ProfileData structure:', JSON.stringify(profileData, null, 2));
  }, [profileData, isLoading, isError, error]);

  useEffect(() => {
    if (profileData?.data?.user) {
      const user = profileData.data.user;
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [profileData]);

  const updateProfile = useMutation({
    mutationFn: (data) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setIsEditing(false);
      setNotification({
        show: true,
        type: 'success',
        title: 'Succès',
        message: 'Profil mis à jour avec succès !'
      });
    },
    onError: (error) => {
      setNotification({
        show: true,
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de la mise à jour'
      });
    },
  });

  const requestVendor = useMutation({
    mutationFn: async (data) => {
      // Convertir les images en base64
      const photoBase64 = await fileToBase64(data.photo);
      const identityDocBase64 = await fileToBase64(data.identityDocument);
      
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
      setShowVendorRequest(false);
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
      setNotification({
        show: true,
        type: 'success',
        title: 'Demande envoyée !',
        message: 'Votre demande pour devenir vendeur a été envoyée avec succès. Nous examinerons votre dossier dans les plus brefs délais.'
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de l\'envoi de la demande';
      setNotification({
        show: true,
        type: 'error',
        title: 'Erreur',
        message: message
      });
    },
  });

  // Helper function to convert file to base64
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
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('❌ Le fichier ne doit pas dépasser 5MB');
        return;
      }
      
      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        alert('❌ Seules les images sont acceptées');
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Chargement du profil...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <User className="h-24 w-24 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-red-600">Erreur de chargement</h2>
        <p className="text-muted-foreground mb-4">{error?.response?.data?.message || error?.message || 'Erreur inconnue'}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const profile = profileData?.data?.user;

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <User className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Profil introuvable</h2>
        <p className="text-muted-foreground mb-2">Les données du profil sont vides</p>
        <pre className="text-xs text-left bg-gray-100 p-4 rounded mt-4 max-w-md mx-auto overflow-auto">
          {JSON.stringify(profileData, null, 2)}
        </pre>
      </div>
    );
  }

  const isVendor = profile?.role === 'vendeur';
  const isApprovedVendor = profile?.vendorInfo?.validationStatus === 'approved';

  // Filtrer les notifications non lues
  const unreadNotifications = profile?.notifications?.filter(notif => !notif.read) || [];
  const hasUnreadNotifications = unreadNotifications.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header avec gradient */}
      <div className="gradient-hero rounded-2xl p-8 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full gradient-card flex items-center justify-center shadow-xl border-4 border-white/20">
                <User className="h-12 w-12 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2">{profile?.firstName} {profile?.lastName}</h1>
                <div className="flex items-center gap-4">
                  <span className="px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                    {profile?.role === 'vendeur' ? '🏪 Vendeur' : '👤 Client'}
                  </span>
                  <span className="px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                    ✅ Compte vérifié
                  </span>
                </div>
              </div>
            </div>

            {/* Bouton Switch vers Espace Vendeur */}
            {isApprovedVendor && (
              <button
                onClick={() => navigate('/vendor-dashboard')}
                className="flex items-center gap-3 px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Store className="h-5 w-5" />
                <span>Accéder à mon espace vendeur</span>
                <ArrowRightLeft className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      {hasUnreadNotifications && (
        <div className="mb-8 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary animate-pulse" />
            Notifications ({unreadNotifications.length})
          </h2>
          {unreadNotifications.map((notif, index) => {
            const isApproval = notif.type === 'vendor_approved' || notif.type === 'product_approved';
            const isRejection = notif.type === 'vendor_rejected' || notif.type === 'product_rejected';
            const isProduct = notif.type === 'product_approved' || notif.type === 'product_rejected';
            
            return (
              <div 
                key={index}
                className={`p-6 rounded-xl border-2 shadow-lg transform hover:scale-[1.02] transition-all ${
                  isApproval
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${
                    isApproval
                      ? 'bg-green-100' 
                      : 'bg-red-100'
                  }`}>
                    {isApproval ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg mb-2 flex items-center gap-2 ${
                      isApproval
                        ? 'text-green-800' 
                        : 'text-red-800'
                    }`}>
                      {isProduct && <Package className="h-5 w-5" />}
                      {notif.title}
                    </h3>
                    <p className="text-gray-700 mb-2">{notif.message}</p>
                    {notif.data?.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-200">
                        <p className="text-sm font-semibold text-red-800">Motif du rejet :</p>
                        <p className="text-sm text-red-700 mt-1">{notif.data.rejectionReason}</p>
                      </div>
                    )}
                    {isProduct && notif.data?.productTitle && (
                      <div className="mt-2 text-sm text-gray-600">
                        Produit : <span className="font-semibold">{notif.data.productTitle}</span>
                      </div>
                    )}
                    {notif.data?.negotiationEnabled && (
                      <div className="mt-2 p-2 bg-green-100 rounded text-sm text-green-800">
                        ✨ Négociation activée à {notif.data.negotiationPercentage}%
                      </div>
                    )}
                    {notif.type === 'vendor_approved' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-800">⚠️ Action requise</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Veuillez vous déconnecter et vous reconnecter pour accéder à votre espace vendeur.
                      </p>
                      <button
                        onClick={() => {
                          localStorage.removeItem('tyda_token');
                          localStorage.removeItem('tyda_user_role');
                          navigate('/login');
                        }}
                        className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-semibold hover:bg-yellow-700 transition-colors"
                      >
                        Se déconnecter maintenant
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-3">
                      {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar - Statistiques */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Statistiques
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg hover:bg-primary/10 transition-all cursor-pointer">
                <span className="text-sm text-muted-foreground">Commandes</span>
                <span className="text-xl font-bold text-primary">0</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary/5 rounded-lg hover:bg-secondary/10 transition-all cursor-pointer">
                <span className="text-sm text-muted-foreground">Favoris</span>
                <span className="text-xl font-bold text-secondary">0</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-accent rounded-lg hover:bg-accent/80 transition-all cursor-pointer">
                <span className="text-sm text-muted-foreground">Panier</span>
                <span className="text-xl font-bold">0</span>
              </div>
            </div>
          </div>

          {/* Info compte */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Informations du compte
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Membre depuis {new Date(profile?.createdAt || Date.now()).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Statut: {profile?.accountStatus === 'active' ? 'Actif' : 'En attente'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations personnelles */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <User className="h-6 w-6 text-primary" />
                Informations personnelles
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-md"
                >
                  <Edit2 className="h-4 w-4" />
                  Modifier
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-accent transition-all"
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
                className="space-y-5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prénom</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="tel"
                      value={formData.phone}
                      disabled
                      className="w-full pl-11 pr-4 py-3 bg-muted border border-input rounded-lg cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Le numéro de téléphone ne peut pas être modifié</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Adresse</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Ex: Cocody, Abidjan"
                      className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Enregistrer les modifications
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg hover:bg-accent transition-all cursor-pointer">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nom complet</p>
                    <p className="font-medium">{profile?.firstName} {profile?.lastName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg hover:bg-accent transition-all cursor-pointer">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg hover:bg-accent transition-all cursor-pointer">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{profile?.phone}</p>
                  </div>
                </div>
                {profile?.address && (
                  <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg hover:bg-accent transition-all cursor-pointer">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Adresse</p>
                      <p className="font-medium">{profile.address}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Devenir vendeur */}
          {!isVendor && (
            <div className="bg-gradient-to-br from-secondary/10 via-primary/5 to-background border border-secondary/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-start gap-4">
                  <div className="p-4 gradient-secondary rounded-xl shadow-lg">
                    <Store className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">Devenez vendeur sur TYDA 🇨🇮</h3>
                    <p className="text-muted-foreground mb-6">
                      Rejoignez notre communauté de vendeurs et commencez à vendre vos produits dès aujourd'hui.
                    </p>
                    {!showVendorRequest ? (
                      <button
                        onClick={() => setShowVendorRequest(true)}
                        className="flex items-center gap-2 px-6 py-3 gradient-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                      >
                        <Store className="h-5 w-5" />
                        Faire une demande
                      </button>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!vendorFormData.fullName || !vendorFormData.businessName || 
                              !vendorFormData.businessDescription || !vendorFormData.businessAddress ||
                              !vendorFormData.photo || !vendorFormData.identityDocument) {
                            alert('❌ Tous les champs sont requis');
                            return;
                          }
                          requestVendor.mutate(vendorFormData);
                        }}
                        className="space-y-4"
                      >
                        {/* Nom complet */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            <User className="inline h-4 w-4 mr-1" />
                            Nom complet *
                          </label>
                          <input
                            type="text"
                            value={vendorFormData.fullName}
                            onChange={(e) => setVendorFormData({...vendorFormData, fullName: e.target.value})}
                            placeholder="Ex: Jean Kouassi"
                            className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                            required
                          />
                        </div>

                        {/* Nom de l'entreprise */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            <Store className="inline h-4 w-4 mr-1" />
                            Nom de l'entreprise *
                          </label>
                          <input
                            type="text"
                            value={vendorFormData.businessName}
                            onChange={(e) => setVendorFormData({...vendorFormData, businessName: e.target.value})}
                            placeholder="Ex: Boutique Kouassi"
                            className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                            required
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            <FileText className="inline h-4 w-4 mr-1" />
                            Description de votre activité *
                          </label>
                          <textarea
                            value={vendorFormData.businessDescription}
                            onChange={(e) => setVendorFormData({...vendorFormData, businessDescription: e.target.value})}
                            placeholder="Décrivez votre activité commerciale..."
                            rows={3}
                            className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all resize-none"
                            required
                          />
                        </div>

                        {/* Adresse */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            <MapPin className="inline h-4 w-4 mr-1" />
                            Adresse de l'entreprise *
                          </label>
                          <input
                            type="text"
                            value={vendorFormData.businessAddress}
                            onChange={(e) => setVendorFormData({...vendorFormData, businessAddress: e.target.value})}
                            placeholder="Ex: Cocody, Abidjan"
                            className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                            required
                          />
                        </div>

                        {/* Photo */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            <Image className="inline h-4 w-4 mr-1" />
                            Votre photo *
                          </label>
                          <div className="flex items-center gap-4">
                            {vendorFormData.photoPreview && (
                              <img 
                                src={vendorFormData.photoPreview} 
                                alt="Aperçu photo"
                                className="w-20 h-20 object-cover rounded-lg border-2 border-secondary"
                              />
                            )}
                            <label className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-input rounded-lg hover:border-secondary hover:bg-secondary/5 transition-all">
                                <Upload className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {vendorFormData.photo ? vendorFormData.photo.name : 'Choisir une photo'}
                                </span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'photo')}
                                className="hidden"
                                required={!vendorFormData.photo}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Pièce d'identité */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            <FileText className="inline h-4 w-4 mr-1" />
                            Pièce d'identité *
                          </label>
                          <div className="flex items-center gap-4">
                            {vendorFormData.identityDocumentPreview && (
                              <img 
                                src={vendorFormData.identityDocumentPreview} 
                                alt="Aperçu pièce"
                                className="w-20 h-20 object-cover rounded-lg border-2 border-secondary"
                              />
                            )}
                            <label className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-input rounded-lg hover:border-secondary hover:bg-secondary/5 transition-all">
                                <Upload className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {vendorFormData.identityDocument ? vendorFormData.identityDocument.name : 'CNI, Passeport ou Attestation'}
                                </span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'identityDocument')}
                                className="hidden"
                                required={!vendorFormData.identityDocument}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                          <p className="text-xs text-muted-foreground">
                            📋 <strong>Rappel :</strong> Tous les champs sont obligatoires. 
                            Votre demande sera examinée par notre équipe dans les 48h.
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={requestVendor.isPending}
                            className="flex-1 gradient-secondary text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
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
                          <button
                            type="button"
                            onClick={() => {
                              setShowVendorRequest(false);
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
                            }}
                            className="px-6 py-3 border rounded-lg hover:bg-accent transition-all"
                          >
                            Annuler
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de notification */}
      {notification.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className={`p-6 rounded-t-2xl ${notification.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}>
              <div className="flex items-center gap-3 text-white">
                {notification.type === 'success' ? (
                  <div className="p-2 bg-white/20 rounded-full">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="p-2 bg-white/20 rounded-full">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                <h3 className="text-xl font-bold">{notification.title}</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">{notification.message}</p>
              <button
                onClick={() => setNotification({ ...notification, show: false })}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                  notification.type === 'success' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90' 
                    : 'bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90'
                }`}
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
