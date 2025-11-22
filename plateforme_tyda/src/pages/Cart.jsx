import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi, ordersApi } from '../lib/api';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Loader2 } from 'lucide-react';

export default function Cart() {
  const queryClient = useQueryClient();
  
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

  const createOrder = useMutation({
    mutationFn: (data) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      alert('Commande créée avec succès!');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Votre panier est vide</h2>
          <p className="text-muted-foreground mb-6">
            Ajoutez des produits pour commencer vos achats
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
          >
            Découvrir les produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mon panier</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item._id} className="flex gap-4 p-4 border rounded-lg">
              <Link to={`/products/${item.product._id}`} className="flex-shrink-0">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
                  {item.product.images?.[0] && (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </Link>

              <div className="flex-1">
                <Link
                  to={`/products/${item.product._id}`}
                  className="font-semibold hover:text-primary line-clamp-2"
                >
                  {item.product.name}
                </Link>
                <p className="text-lg font-bold text-primary mt-1">
                  {item.product.price.toLocaleString()} FCFA
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantity.mutate({
                      itemId: item._id,
                      quantity: Math.max(1, item.quantity - 1),
                    })
                  }
                  className="p-1 border rounded hover:bg-accent"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantity.mutate({
                      itemId: item._id,
                      quantity: item.quantity + 1,
                    })
                  }
                  className="p-1 border rounded hover:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => removeItem.mutate(item._id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-20">
            <h3 className="font-semibold text-lg mb-4">Résumé de la commande</h3>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-semibold">{total.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livraison</span>
                <span className="font-semibold">Gratuite</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{total.toLocaleString()} FCFA</span>
              </div>
            </div>

            <button
              onClick={() =>
                createOrder.mutate({
                  items: items.map((i) => ({
                    product: i.product._id,
                    quantity: i.quantity,
                    price: i.product.price,
                  })),
                })
              }
              className="w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
            >
              Commander
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
