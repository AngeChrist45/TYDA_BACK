import { useQuery } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api';
import { Package, TrendingUp, MessageSquare, DollarSign } from 'lucide-react';

export default function VendorDashboard() {
  const { data: dashboardData } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: vendorApi.getDashboard,
  });

  const stats = dashboardData?.data || {
    totalProducts: 0,
    totalSales: 0,
    pendingNegotiations: 0,
    revenue: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">Aperçu de votre activité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Produits"
          value={stats.totalProducts}
          icon={Package}
          color="primary"
        />
        <StatCard
          title="Ventes"
          value={stats.totalSales}
          icon={TrendingUp}
          color="secondary"
        />
        <StatCard
          title="Négociations"
          value={stats.pendingNegotiations}
          icon={MessageSquare}
          color="primary"
        />
        <StatCard
          title="Revenus"
          value={`${stats.revenue?.toLocaleString()} FCFA`}
          icon={DollarSign}
          color="secondary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Activité récente</h3>
          <p className="text-muted-foreground text-sm">Aucune activité récente</p>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Produits populaires</h3>
          <p className="text-muted-foreground text-sm">Données non disponibles</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-lg bg-${color}/10`}>
          <Icon className={`h-5 w-5 text-${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
