import { useQuery } from '@tanstack/react-query';
import { favoritesApi } from '../lib/api';
import { Link } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';

export default function Favorites() {
  const { data: favoritesData, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const favorites = favoritesData?.data || [];

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Aucun favori</h2>
          <p className="text-muted-foreground mb-6">
            Ajoutez des produits à vos favoris pour les retrouver facilement
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
      <h1 className="text-3xl font-bold mb-8">Mes favoris</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {favorites.map((fav) => (
          <ProductCard key={fav._id} product={fav.product} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  const hasNegotiation = product.negotiation?.enabled && product.negotiation?.discountPercentage > 0;

  return (
    <Link
      to={`/products/${product._id}`}
      className="group border rounded-lg overflow-hidden hover:shadow-xl transition-all"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.images?.[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        {hasNegotiation && (
          <div className="absolute top-2 right-2 px-3 py-1 bg-secondary text-white text-xs font-semibold rounded-full">
            Négociable -{product.negotiation.discountPercentage}%
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {product.name}
        </h3>
        <span className="text-2xl font-bold text-primary">
          {product.price.toLocaleString()} FCFA
        </span>
      </div>
    </Link>
  );
}
