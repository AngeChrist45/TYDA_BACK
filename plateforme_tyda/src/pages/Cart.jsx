import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi, ordersApi } from '../lib/api';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Loader2, ArrowRight, Package, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function Cart() {
  const queryClient = useQueryClient();
  const [orderLoading, setOrderLoading] = useState(false);
  
  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
  });

  const updateQuantity = useMutation({
    mutationFn: ({ itemId, quantity }) => cartApi.update(itemId, quantity),
    onSuccess: () => queryClient.invalidateQueries(['cart']),
  });

  const removeItem = useMutation({
    mutationFn: (itemId) => cartApi.remove(itemId),
    onSuccess: () => queryClient.invalidateQueries(['cart']),
  });

  const clearCart = useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => queryClient.invalidateQueries(['cart']),
  });

  const handleCreateOrder = async () => {
    setOrderLoading(true);
    try {
      await ordersApi.create({
        items: cart.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price
        }))
      });
      queryClient.invalidateQueries(['cart']);
      alert('✅ Commande créée avec succès!');
    } catch (error) {
      alert('❌ Erreur lors de la création de la commande');
    } finally {
      setOrderLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const cart = cartData?.data;
  const items = cart?.items || [];
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full gradient-hero mb-6 shadow-2xl animate-bounce">
            <ShoppingBag className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Votre panier est vide</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Découvrez nos produits et commencez vos achats dès maintenant
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-4 gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Package className="h-5 w-5" />
            Découvrir les produits
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mon Panier</h1>
          <p className="text-muted-foreground">{items.length} article{items.length > 1 ? 's' : ''}</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => clearCart.mutate()}
            disabled={clearCart.isLoading}
            className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-all flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Vider le panier
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div 
              key={item._id} 
              className="group relative flex gap-4 p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <Link to={`/products/${item.product._id}`} className="flex-shrink-0">
                <div className="w-28 h-28 rounded-xl overflow-hidden bg-muted shadow-md group-hover:shadow-xl transition-shadow">
                  {item.product.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  to={`/products/${item.product._id}`}
                  className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2 mb-2"
                >
                  {item.product.name}
                </Link>
                
                {item.product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                    {item.product.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4">
                  <p className="text-2xl font-bold text-primary">
                    {item.product.price.toLocaleString()} <span className="text-lg">FCFA</span>
                  </p>
                  
                  {item.product.stock < 10 && (
                    <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded-full flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Stock limité
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeItem.mutate(item._id)}
                  disabled={removeItem.isLoading}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                  title="Supprimer"
                >
                  <Trash2 className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
                  <button
                    onClick={() => {
                      if (item.quantity > 1) {
                        updateQuantity.mutate({ itemId: item._id, quantity: item.quantity - 1 });
                      }
                    }}
                    disabled={updateQuantity.isLoading || item.quantity <= 1}
                    className="p-2 hover:bg-background rounded-lg transition-all disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  
                  <span className="w-12 text-center font-semibold text-lg">
                    {item.quantity}
                  </span>
                  
                  <button
                    onClick={() => updateQuantity.mutate({ itemId: item._id, quantity: item.quantity + 1 })}
                    disabled={updateQuantity.isLoading || item.quantity >= item.product.stock}
                    className="p-2 hover:bg-background rounded-lg transition-all disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                  Sous-total: <span className="font-bold text-foreground">{(item.product.price * item.quantity).toLocaleString()} FCFA</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-6">Résumé de la commande</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-semibold">{total.toLocaleString()} FCFA</span>
              </div>
              
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">Livraison</span>
                <span className="font-semibold text-secondary">Gratuite</span>
              </div>
              
              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-bold">Total</span>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {total.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">FCFA</div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateOrder}
              disabled={orderLoading}
              className="w-full py-4 gradient-primary text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {orderLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  Passer la commande
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <div className="mt-6 p-4 bg-secondary/10 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-secondary/20 rounded-lg">
                  <Package className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold mb-1">Livraison rapide 🚀</p>
                  <p className="text-sm text-muted-foreground">
                    Livraison gratuite pour toutes les commandes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
