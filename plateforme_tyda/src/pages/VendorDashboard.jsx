import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, vendorApi } from '../lib/api';
import { Package, MessageSquare, DollarSign, ShoppingBag, ArrowRight, Loader2, TrendingUp, ArrowLeft } from 'lucide-react';

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
    queryFn: vendorApi.getDashboard,
  });

  const profile = profileData?.data?.user;
  const isApprovedVendor = profile?.vendorInfo?.validationStatus === 'approved';

  const stats = dashboardData?.data || {
    totalProducts: 0,
    totalSales: 0,
    pendingNegotiations: 0,
    revenue: 0,
  };

  if (profileLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!isApprovedVendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Accès réservé aux vendeurs approuvés</p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Retour au profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour au profil</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Tableau de bord vendeur</h1>
              <p className="text-white/90">Bienvenue {profile?.firstName} !</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards - Cliquables */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Produits"
            value={stats.totalProducts}
            icon={Package}
            color="orange"
            onClick={() => navigate('/vendor/products')}
          />
          <StatCard
            title="Commandes"
            value={stats.totalSales}
            icon={ShoppingBag}
            color="blue"
            onClick={() => navigate('/vendor/orders')}
          />
          <StatCard
            title="Négociations"
            value={stats.pendingNegotiations}
            icon={MessageSquare}
            color="purple"
            onClick={() => navigate('/vendor/negotiations')}
          />
          <StatCard
            title="Revenus"
            value={`${stats.revenue?.toLocaleString()} FCFA`}
            icon={DollarSign}
            color="green"
          />
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ActionCard
            title="Ajouter un produit"
            description="Créez un nouveau produit à vendre"
            icon={Package}
            color="orange"
            onClick={() => navigate('/vendor/products')}
          />
          <ActionCard
            title="Voir mes produits"
            description="Gérez tous vos produits"
            icon={TrendingUp}
            color="blue"
            onClick={() => navigate('/vendor/products')}
          />
          <ActionCard
            title="Négociations en cours"
            description="Répondez aux demandes clients"
            icon={MessageSquare}
            color="purple"
            onClick={() => navigate('/vendor/negotiations')}
          />
        </div>

        {/* Sections info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Conseils vendeur</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>📸 Ajoutez des photos de qualité pour vos produits</p>
              <p>💰 Activez la négociation pour attirer plus de clients</p>
              <p>⚡ Répondez rapidement aux demandes de négociation</p>
              <p>📦 Maintenez votre stock à jour</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2 text-orange-900">Besoin d'aide ?</h3>
            <p className="text-sm text-orange-800 mb-4">
              Consultez notre guide vendeur pour maximiser vos ventes
            </p>
            <button
              onClick={() => navigate('/vendor/products')}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-semibold"
            >
              <Package className="h-4 w-4" />
              Commencer à vendre
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, onClick }) {
  const colorClasses = {
    orange: 'bg-orange-500 hover:bg-orange-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    green: 'bg-green-500 hover:bg-green-600',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-6 shadow-sm hover:shadow-lg transition-all ${onClick ? 'cursor-pointer transform hover:scale-105' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <div className={`p-3 rounded-lg ${colorClasses[color]} text-white`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {onClick && (
        <div className="mt-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <span>Voir détails</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function ActionCard({ title, description, icon: Icon, color, onClick }) {
  const colorClasses = {
    orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl p-6 bg-gradient-to-br ${colorClasses[color]} text-white cursor-pointer transform hover:scale-105 transition-all shadow-lg hover:shadow-xl`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="relative z-10">
        <Icon className="h-10 w-10 mb-3" />
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm text-white/90">{description}</p>
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
          <span>Accéder</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
