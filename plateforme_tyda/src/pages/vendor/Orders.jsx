import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api';
import { Package, Loader2, ShoppingBag, Calendar, MapPin, Phone, Mail, ArrowLeft, CheckCircle, Clock, XCircle, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VendorOrders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // all, pending, completed, cancelled

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['vendor-orders'],
    queryFn: vendorApi.getOrders,
  });

  const orders = ordersData?.data?.orders || [];

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.status === 'pending' || order.status === 'processing';
    if (activeTab === 'completed') return order.status === 'completed' || order.status === 'delivered';
    if (activeTab === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: Clock,
        text: 'En attente',
        class: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      },
      processing: {
        icon: Package,
        text: 'En traitement',
        class: 'bg-blue-100 text-blue-800 border-blue-300'
      },
      shipped: {
        icon: Truck,
        text: 'Expédié',
        class: 'bg-purple-100 text-purple-800 border-purple-300'
      },
      delivered: {
        icon: CheckCircle,
        text: 'Livré',
        class: 'bg-green-100 text-green-800 border-green-300'
      },
      completed: {
        icon: CheckCircle,
        text: 'Terminé',
        class: 'bg-green-100 text-green-800 border-green-300'
      },
      cancelled: {
        icon: XCircle,
        text: 'Annulé',
        class: 'bg-red-100 text-red-800 border-red-300'
      }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${badge.class}`}>
        <Icon className="h-3 w-3" />
        {badge.text}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/vendor-dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Retour au dashboard</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mes commandes</h1>
            <p className="text-gray-600">{orders.length} commande(s) au total</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-3 font-medium transition-all ${
            activeTab === 'all'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Toutes ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-3 font-medium transition-all ${
            activeTab === 'pending'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          En cours ({orders.filter(o => o.status === 'pending' || o.status === 'processing').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-3 font-medium transition-all ${
            activeTab === 'completed'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Terminées ({orders.filter(o => o.status === 'completed' || o.status === 'delivered').length})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-3 font-medium transition-all ${
            activeTab === 'cancelled'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Annulées ({orders.filter(o => o.status === 'cancelled').length})
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Aucune commande dans cette catégorie</p>
          <p className="text-sm text-gray-400">
            Les commandes de vos clients apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">Commande #{order._id.slice(-8)}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">
                    {order.total?.toLocaleString()} FCFA
                  </p>
                  <p className="text-sm text-gray-500">{order.items?.length || 0} article(s)</p>
                </div>
              </div>

              {/* Client info */}
              {order.customer && (
                <div className="border-t pt-4 mb-4">
                  <h4 className="font-semibold mb-2 text-sm text-gray-700">Informations client</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      {order.customer.email}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      {order.customer.phone}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {order.shippingAddress?.address || 'Non spécifié'}
                    </div>
                  </div>
                </div>
              )}

              {/* Products */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 text-sm text-gray-700">Produits commandés</h4>
                <div className="space-y-2">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        {item.product?.images?.[0]?.url ? (
                          <img 
                            src={item.product.images[0].url} 
                            alt={item.product.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product?.title || 'Produit'}</p>
                        <p className="text-xs text-gray-500">Quantité: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-sm">
                        {(item.price * item.quantity)?.toLocaleString()} FCFA
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {order.status === 'pending' && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                      Accepter la commande
                    </button>
                    <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all">
                      Refuser
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
