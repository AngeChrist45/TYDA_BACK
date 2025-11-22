import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, cartApi, favoritesApi, negotiationsApi } from '../lib/api';
import { Heart, ShoppingCart, TrendingDown, Loader2 } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [proposedPrice, setProposedPrice] = useState('');
  const [showNegotiation, setShowNegotiation] = useState(false);

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id),
  });

  const addToCart = useMutation({
    mutationFn: () => cartApi.add(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      alert('Produit ajouté au panier');
    },
  });

  const addToFavorites = useMutation({
    mutationFn: () => favoritesApi.add(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites']);
      alert('Ajouté aux favoris');
    },
  });

  const createNegotiation = useMutation({
    mutationFn: () => negotiationsApi.create(id, parseInt(proposedPrice)),
    onSuccess: () => {
      alert('Négociation envoyée au vendeur');
      setShowNegotiation(false);
      setProposedPrice('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const product = productData?.data;
  if (!product) return <div>Produit non trouvé</div>;

  const hasNegotiation = product.negotiation?.enabled && product.negotiation?.discountPercentage > 0;
  const minPrice = hasNegotiation ? product.price * (1 - product.negotiation.discountPercentage / 100) : product.price;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            {product.images?.[0] && (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-muted-foreground">{product.category?.name}</p>
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-bold text-primary">
              {product.price.toLocaleString()} FCFA
            </span>
            {hasNegotiation && (
              <div className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-semibold">
                Négociable -{product.negotiation.discountPercentage}%
              </div>
            )}
          </div>

          {hasNegotiation && (
            <div className="p-4 border rounded-lg bg-secondary/5">
              <p className="text-sm mb-2">
                <TrendingDown className="inline h-4 w-4 mr-1" />
                Prix minimum négociable: <span className="font-bold">{minPrice.toLocaleString()} FCFA</span>
              </p>
              {!showNegotiation ? (
                <button
                  onClick={() => setShowNegotiation(true)}
                  className="w-full px-4 py-2 border-2 border-secondary text-secondary rounded-lg font-semibold hover:bg-secondary hover:text-white transition-colors"
                >
                  Proposer un prix
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder={`Min: ${minPrice.toLocaleString()} FCFA`}
                    min={minPrice}
                    max={product.price}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => createNegotiation.mutate()}
                      disabled={!proposedPrice || proposedPrice < minPrice}
                      className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary/90 disabled:opacity-50"
                    >
                      Envoyer
                    </button>
                    <button
                      onClick={() => setShowNegotiation(false)}
                      className="px-4 py-2 border rounded-lg"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Quantité</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max={product.stock}
              className="w-24 px-4 py-2 border rounded-lg"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {product.stock} en stock
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => addToCart.mutate()}
              disabled={product.stock < 1}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              Ajouter au panier
            </button>
            <button
              onClick={() => addToFavorites.mutate()}
              className="px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Heart className="h-5 w-5" />
            </button>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Description</h3>
            <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
          </div>

          {product.vendor && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-2">Vendu par</h3>
              <p className="text-muted-foreground">
                {product.vendor.vendorInfo?.businessName || 
                 `${product.vendor.firstName} ${product.vendor.lastName}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
