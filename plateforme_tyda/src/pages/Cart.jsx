import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Cart() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [notification, setNotification] = useState('');
  
  const { data: cartData, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
    staleTime: 1000,
    cacheTime: 5000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const updateQuantity = useMutation({
    mutationFn: ({ itemId, quantity }) => cartApi.update(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeItem = useMutation({
    mutationFn: (itemId) => cartApi.remove(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const clearCart = useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du panier...</p>
        </div>
      </div>
    );
  }

  const cart = cartData?.data?.data;
  const items = cart?.items || [];
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">🛒</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Votre panier est vide</h2>
          <p className="text-gray-600 mb-8">
            Découvrez nos produits et commencez vos achats
          </p>
          <Link
            to="/products"
            className="inline-block px-8 py-3 bg-[#FF6B35] text-white rounded-lg font-medium hover:bg-[#e55a2b]"
          >
            Découvrir les produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 bg-[#2ECC71] text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon Panier</h1>
          <p className="text-gray-600">{items.length} article{items.length > 1 ? 's' : ''}</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => clearCart.mutate()}
            disabled={clearCart.isLoading}
            className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            Vider le panier
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item._id} className="flex gap-4 p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <Link to={`/products/${item.product._id}`} className="flex-shrink-0">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                  {item.product.images?.[0]?.url || item.product.images?.[0] ? (
                    <img
                      src={item.product.images[0]?.url || item.product.images[0]}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      📦
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex-1">
                <Link
                  to={`/products/${item.product._id}`}
                  className="font-semibold text-lg text-gray-900 hover:text-[#FF6B35] mb-2 block"
                >
                  {item.product.title}
                </Link>
                
                <p className="text-xl font-bold text-[#FF6B35] mb-3">
                  {item.price?.toLocaleString()} FCFA
                </p>

                <div className="flex items-center gap-4">
                  {/* Quantity Controls */}
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => {
                        if (item.quantity > 1) {
                          updateQuantity.mutate({ itemId: item._id, quantity: item.quantity - 1 });
                        }
                      }}
                      disabled={updateQuantity.isLoading || item.quantity <= 1}
                      className="px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
                    >
                      −
                    </button>
                    
                    <span className="px-4 py-1 border-x border-gray-300 font-medium">
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => updateQuantity.mutate({ itemId: item._id, quantity: item.quantity + 1 })}
                      disabled={updateQuantity.isLoading}
                      className="px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem.mutate(item._id)}
                    disabled={removeItem.isLoading}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    🗑️ Retirer
                  </button>
                </div>

                <p className="text-sm text-gray-600 mt-2">
                  Sous-total: <span className="font-bold text-gray-900">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Résumé</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-semibold text-gray-900">{total.toLocaleString()} FCFA</span>
              </div>
              
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">Livraison</span>
                <span className="font-semibold text-[#2ECC71]">Gratuite</span>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <div className="text-3xl font-bold text-[#FF6B35]">
                    {total.toLocaleString()} <span className="text-lg">FCFA</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3 bg-[#FF6B35] text-white rounded-lg font-bold text-lg hover:bg-[#e55a2b] transition-colors"
            >
              Passer la commande
            </button>

            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700">
                🚀 <span className="font-semibold">Livraison rapide</span><br/>
                Livraison gratuite pour toutes les commandes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
