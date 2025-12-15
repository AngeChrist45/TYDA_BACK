import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi, cartApi, favoritesApi } from '../lib/api';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function ProductCard({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const token = localStorage.getItem('tyda_token');

  const addToCart = useMutation({
    mutationFn: () => {
      console.log('🛒 [Products] Ajout au panier:', { productId: product._id, quantity });
      return cartApi.add(product._id, quantity);
    },
    onSuccess: () => {
      console.log('✅ [Products] Produit ajouté au panier avec succès');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.refetchQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      console.error('❌ [Products] Erreur ajout panier:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  });

  const addToFavorites = useMutation({
    mutationFn: () => favoritesApi.add(product._id),
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites']);
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  });

  const handleNegotiate = (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    navigate(`/products/${product._id}#negotiate`);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    addToCart.mutate();
  };

  const handleAddToFavorites = (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    addToFavorites.mutate();
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/products/${product._id}`} className="block">
        <div className="aspect-square bg-gray-100 relative">
          {product.images?.[0] && (
            <img
              src={product.images[0].url || product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Bouton Favoris au hover */}
          {isHovered && (
            <button
              onClick={handleAddToFavorites}
              className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50"
            >
              ♥
            </button>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/products/${product._id}`}>
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-[#FF6B35]">
            {product.title}
          </h3>
        </Link>
        
        <div className="text-xl font-bold text-gray-900 mb-3">
          {product.price?.toLocaleString()} FCFA
        </div>

        {/* Quantité + Panier */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center border border-gray-300 rounded">
            <button
              onClick={(e) => {
                e.preventDefault();
                setQuantity(Math.max(1, quantity - 1));
              }}
              className="px-2 py-1 hover:bg-gray-50"
            >
              −
            </button>
            <span className="px-3 py-1 text-sm font-medium">{quantity}</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                setQuantity(quantity + 1);
              }}
              className="px-2 py-1 hover:bg-gray-50"
            >
              +
            </button>
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={addToCart.isLoading}
            className="flex-1 py-2 bg-[#FF6B35] text-white text-sm font-medium rounded hover:bg-[#e55a2b] disabled:opacity-50"
          >
            🛒 Panier
          </button>
        </div>

        {/* Bouton Négocier si applicable */}
        {product.negotiation?.enabled && (
          <button
            onClick={handleNegotiate}
            className="w-full py-2 bg-[#2ECC71] text-white text-sm font-medium rounded hover:bg-[#27ae60]"
          >
            Négocier
          </button>
        )}
      </div>
    </div>
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', searchParams.toString()],
    queryFn: () => productsApi.getAll(Object.fromEntries(searchParams)),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const productsArray = productsData?.data?.data?.products || productsData?.data?.products || productsData?.data || [];
  const products = Array.isArray(productsArray) ? productsArray : [];
  const categoriesArray = categoriesData?.data?.data?.categories || categoriesData?.data?.categories || categoriesData?.data || [];
  const categories = Array.isArray(categoriesArray) ? categoriesArray : [];
  const activeCategory = searchParams.get('category');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery) {
      searchParams.set('search', searchQuery);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const handleCategoryFilter = (categoryId) => {
    if (categoryId) {
      searchParams.set('category', categoryId);
    } else {
      searchParams.delete('category');
    }
    setSearchParams(searchParams);
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tous les produits</h1>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6B35]"
            />
          </form>
        </div>

        {/* Filtres catégories */}
        {categories.length > 0 && (
          <div className="mb-8">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleCategoryFilter(null)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  !activeCategory
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-[#FF6B35]'
                }`}
              >
                Toutes les catégories
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryFilter(category._id)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    activeCategory === category._id
                      ? 'bg-[#FF6B35] text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-[#FF6B35]'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Produits */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
