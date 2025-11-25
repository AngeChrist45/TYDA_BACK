import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, vendorApi } from '../lib/api';
import { 
  Store, Package, TrendingUp, DollarSign, ShoppingCart, 
  ArrowLeft, Bell, BarChart3, Users, Calendar, Eye, Loader2, Clock
} from 'lucide-react';

export default function VendorDashboard() {
  const navigate = useNavigate();
  
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await authApi.getCurrentUser();
      return response.data;
    },
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: async () => {
      const response = await vendorApi.getDashboard();
      return response.data;
    },
    enabled: !!profileData?.data?.user?.vendorInfo?.validationStatus,
  });

  const profile = profileData?.data?.user;
  const isApprovedVendor = profile?.vendorInfo?.validationStatus === 'approved';
  const stats = dashboardData?.data || {
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  };

  // Redirection si pas vendeur approuvé
  useEffect(() => {
    if (profile && !isApprovedVendor) {
      navigate('/profile');
    }
  }, [profile, isApprovedVendor, navigate]);

  if (profileLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isApprovedVendor) {
    return null;
  }

  const notifications = profile?.notifications?.filter(n => n.type === 'order_received') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour au profil client</span>
          </button>
          
          <div className="gradient-hero rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    🏪 Espace Vendeur
                  </h1>
                  <p className="text-white/80 text-lg">
                    {profile?.vendorInfo?.businessName}
                  </p>
                </div>
                {notifications.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                    <Bell className="h-5 w-5 text-white animate-pulse" />
                    <span className="text-white font-semibold">{notifications.length} nouvelles notifications</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalProducts}</div>
            <div className="text-sm text-gray-600">Produits actifs</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalOrders}</div>
            <div className="text-sm text-gray-600">Commandes totales</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="px-2 py-1 bg-orange-100 rounded-full text-xs font-semibold text-orange-600">
                En attente
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingOrders}</div>
            <div className="text-sm text-gray-600">Commandes en attente</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalRevenue} FCFA</div>
            <div className="text-sm text-gray-600">Revenu total</div>
          </div>
        </div>

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8 border border-orange-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell className="h-6 w-6 text-orange-600" />
              Nouvelles commandes ({notifications.length})
            </h2>
            <div className="space-y-3">
              {notifications.map((notif, index) => (
                <div 
                  key={index}
                  className="p-4 bg-orange-50 rounded-lg border border-orange-200 hover:border-orange-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Eye className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Produits Section */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg border border-orange-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6 text-orange-600" />
                Mes Produits
              </h2>
              <Link 
                to="/vendor/products"
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all inline-block"
              >
                Gérer mes produits →
              </Link>
            </div>
            
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {stats.totalProducts === 0 
                  ? 'Aucun produit pour le moment' 
                  : `${stats.totalProducts} produit(s) enregistré(s)`
                }
              </p>
              <Link
                to="/vendor/products"
                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors inline-block"
              >
                {stats.totalProducts === 0 ? 'Ajouter mon premier produit' : 'Voir tous mes produits'}
              </Link>
            </div>
          </div>

          {/* Sidebar - Statistiques détaillées */}
          <div className="space-y-6">
            {/* Chiffre d'affaires */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                Chiffre d'affaires
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Ce mois</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.monthlyRevenue} FCFA</p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalRevenue} FCFA</p>
                </div>
              </div>
            </div>

            {/* Informations Business */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Store className="h-5 w-5 text-orange-600" />
                Mon Commerce
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Nom commercial</p>
                  <p className="font-semibold text-gray-900">{stats.businessInfo?.businessName || profile?.vendorInfo?.businessName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Description</p>
                  <p className="text-gray-700">{stats.businessInfo?.businessDescription || profile?.vendorInfo?.businessDescription}</p>
                </div>
                <div>
                  <p className="text-gray-600">Adresse</p>
                  <p className="text-gray-700">{stats.businessInfo?.businessAddress || profile?.vendorInfo?.businessAddress}</p>
                </div>
              </div>
            </div>

            {/* Note importante */}
            <div className="bg-orange-50 rounded-xl p-6 border-2 border-orange-200">
              <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Important
              </h3>
              <p className="text-sm text-orange-800">
                Toutes les commandes passent par l'administrateur qui vous contactera 
                pour organiser la livraison. Vous ne communiquez jamais directement avec les clients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
