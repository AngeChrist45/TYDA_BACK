import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../lib/api';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  ShoppingBag,
  Eye,
  MapPin,
  Calendar,
  CreditCard,
  Phone,
  User
} from 'lucide-react';
import { useState } from 'react';

const statusConfig = {
  en_attente: {
    label: 'En attente',
    icon: Clock,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    iconColor: 'text-yellow-600'
  },
  confirmee: {
    label: 'Confirmée',
    icon: CheckCircle2,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600'
  },
  en_preparation: {
    label: 'En préparation',
    icon: Package,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    iconColor: 'text-purple-600'
  },
  en_livraison: {
    label: 'En livraison',
    icon: Truck,
    color: 'text-primary bg-orange-50 border-primary',
    iconColor: 'text-primary'
  },
  livree: {
    label: 'Livrée',
    icon: CheckCircle2,
    color: 'text-secondary bg-green-50 border-secondary',
    iconColor: 'text-secondary'
  },
  annulee: {
    label: 'Annulée',
    icon: XCircle,
    color: 'text-red-600 bg-red-50 border-red-200',
    iconColor: 'text-red-600'
  }
};

export default function Orders() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Chargement de vos commandes...</p>
      </div>
    );
  }

  const orders = Array.isArray(ordersData?.data?.data) ? ordersData.data.data : 
                 Array.isArray(ordersData?.data) ? ordersData.data : [];

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 gradient-primary rounded-full blur-3xl opacity-20 animate-pulse"></div>
            </div>
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground relative z-10 animate-bounce" />
          </div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Aucune commande
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Vous n'avez pas encore passé de commande
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-4 gradient-primary text-white rounded-xl font-semibold hover:shadow-2xl hover:-translate-y-1 transition-all shadow-lg"
          >
            Découvrir les produits
            <Package className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Package className="h-10 w-10 text-primary" />
          Mes commandes
        </h1>
        <p className="text-muted-foreground text-lg">
          {orders.length} commande{orders.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {orders.map((order) => (
          <OrderCard 
            key={order._id} 
            order={order}
            onViewDetails={() => setSelectedOrder(order)}
          />
        ))}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
        
      )}
    </div>
  );
}

function OrderCard({ order, onViewDetails }) {
  const status = statusConfig[order.status] || statusConfig.en_attente;
  const StatusIcon = status.icon;

  return (
    <div className="group bg-card border border-border rounded-2xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 gradient-primary rounded-xl shadow-lg group-hover:scale-110 transition-transform">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">
              Commande #{order.orderNumber || order._id.slice(-6)}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${status.color} font-semibold text-sm`}>
          <StatusIcon className="h-4 w-4" />
          {status.label}
        </div>
      </div>

      {/* Products Summary */}
      <div className="mb-4 space-y-2">
        {order.products?.slice(0, 2).map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg hover:bg-accent transition-all">
            {item.product?.images?.[0] && (
              <img 
                src={item.product.images[0]} 
                alt={item.product.name}
                className="w-12 h-12 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.product?.name}</p>
              <p className="text-sm text-muted-foreground">Quantité: {item.quantity}</p>
            </div>
            <span className="font-bold text-primary">
              {(item.price * item.quantity).toLocaleString()} F
            </span>
          </div>
        ))}
        {order.products?.length > 2 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            +{order.products.length - 2} autre{order.products.length - 2 > 1 ? 's' : ''} produit{order.products.length - 2 > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Montant total</p>
          <span className="text-2xl font-bold text-primary">
            {order.totalPrice?.toLocaleString()} FCFA
          </span>
        </div>
        
        <button
          onClick={onViewDetails}
          className="flex items-center gap-2 px-4 py-2 gradient-primary text-white rounded-lg hover:shadow-xl hover:scale-105 transition-all font-semibold"
        >
          <Eye className="h-4 w-4" />
          Détails
        </button>
      </div>
    </div>
  );
}

function OrderDetailsModal({ order, onClose }) {
  const status = statusConfig[order.status] || statusConfig.en_attente;
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 z-10 gradient-hero p-6 border-b">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                Commande #{order.orderNumber || order._id.slice(-6)}
              </h2>
              <p className="text-white/80 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${status.color}`}>
            <StatusIcon className={`h-8 w-8 ${status.iconColor}`} />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Statut de la commande</p>
              <p className="text-lg font-bold">{status.label}</p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="p-4 bg-accent rounded-xl">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Adresse de livraison
            </h3>
            <p className="text-muted-foreground">{order.shippingAddress || 'Non spécifiée'}</p>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-accent rounded-xl">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Contact
              </h3>
              <p className="text-muted-foreground">{order.user?.firstName} {order.user?.lastName}</p>
            </div>
            <div className="p-4 bg-accent rounded-xl">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Téléphone
              </h3>
              <p className="text-muted-foreground">{order.user?.phone || 'Non disponible'}</p>
            </div>
          </div>

          {/* Products List */}
          <div>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Produits commandés
            </h3>
            <div className="space-y-3">
              {order.products?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-accent rounded-xl hover:bg-accent/80 transition-all">
                  {item.product?.images?.[0] && (
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg shadow-md"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold mb-1">{item.product?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.price.toLocaleString()} FCFA × {item.quantity}
                    </p>
                  </div>
                  <span className="text-xl font-bold text-primary">
                    {(item.price * item.quantity).toLocaleString()} F
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="p-6 gradient-card rounded-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-white" />
              <span className="text-white">Résumé de paiement</span>
            </h3>
            <div className="space-y-2 text-white/90 mb-4">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{(order.totals?.subtotal || order.totalPrice)?.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span>Frais de livraison</span>
                <span className="text-green-300 font-medium">
                  {order.totals?.shipping > 0 ? `${order.totals.shipping.toLocaleString()} FCFA` : 'Gratuite'}
                </span>
              </div>
            </div>
            <div className="flex justify-between pt-4 border-t border-white/20 text-white font-bold text-xl">
              <span>Total</span>
              <span>{(order.totals?.total || order.totalPrice)?.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
