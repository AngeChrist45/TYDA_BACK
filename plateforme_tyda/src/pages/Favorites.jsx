import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '../lib/api';
import { Link } from 'react-router-dom';
import { Heart, Loader2, ShoppingCart, X, Star, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function Favorites() {
  const queryClient = useQueryClient();
  const { data: favoritesData, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesApi.getAll,
  });

  const removeFavorite = useMutation({
    mutationFn: favoritesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites']);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Chargement de vos favoris...</p>
      </div>
    );
  }

  const favorites = favoritesData?.data || [];

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 gradient-secondary rounded-full blur-3xl opacity-20 animate-pulse"></div>
            </div>
            <Heart className="h-24 w-24 mx-auto text-muted-foreground relative z-10 animate-bounce" />
          </div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Aucun favori
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Ajoutez des produits à vos favoris pour les retrouver facilement
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-4 gradient-primary text-white rounded-xl font-semibold hover:shadow-2xl hover:-translate-y-1 transition-all shadow-lg"
          >
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Heart className="h-10 w-10 text-primary fill-primary animate-pulse" />
          Mes favoris
        </h1>
        <p className="text-muted-foreground text-lg">
          {favorites.length} produit{favorites.length > 1 ? 's' : ''} en favoris
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favorites.map((fav) => (
          <ProductCard 
            key={fav._id} 
            product={fav.product}
            onRemove={() => removeFavorite.mutate(fav.product._id)}
            isRemoving={removeFavorite.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, onRemove, isRemoving }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasNegotiation = product.negotiation?.enabled && product.negotiation?.discountPercentage > 0;

  return (
    <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative">
      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onRemove();
        }}
        disabled={isRemoving}
        className="absolute top-3 right-3 z-20 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 hover:scale-110 transition-all shadow-lg opacity-0 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>

      <Link to={`/products/${product._id}`}>
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {product.images?.[0] && (
            <img
              src={product.images[0]}
              alt={product.name}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasNegotiation && (
              <div className="px-3 py-1 gradient-secondary text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                🔥 -{product.negotiation.discountPercentage}%
              </div>
            )}
            {product.stock < 10 && product.stock > 0 && (
              <div className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full shadow-lg">
                Plus que {product.stock} !
              </div>
            )}
            {product.stock === 0 && (
              <div className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full shadow-lg">
                Épuisé
              </div>
            )}
          </div>

          {/* Heart overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <Heart className="h-16 w-16 text-white fill-white animate-pulse" />
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
            {product.name}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.rating.toFixed(1)})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div>
              <span className="text-2xl font-bold text-primary">
                {product.price.toLocaleString()} FCFA
              </span>
              {hasNegotiation && (
                <p className="text-xs text-muted-foreground line-through">
                  {Math.round(product.price / (1 - product.negotiation.discountPercentage / 100)).toLocaleString()} FCFA
                </p>
              )}
            </div>
            
            {/* Quick actions */}
            <div className="opacity-0 group-hover:opacity-100 transition-all">
              <button className="p-2 gradient-primary text-white rounded-lg hover:scale-110 transition-all shadow-lg">
                <ShoppingCart className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
