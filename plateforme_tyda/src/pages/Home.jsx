import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi, authApi, cartApi, favoritesApi } from '../lib/api';
import { useState } from 'react';

function ProductCard({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const token = localStorage.getItem('tyda_token');

  const addToCart = useMutation({
    mutationFn: () => cartApi.add(product._id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.refetchQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
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

export default function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem('tyda_token');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: !!token,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.getAll({ limit: 8 }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const productsArray = products?.data?.data?.products || products?.data?.products || products?.data || [];
  const featuredProducts = Array.isArray(productsArray) ? productsArray : [];
  const categoriesArray = categories?.data?.data?.categories || categories?.data?.categories || categories?.data || [];
  const allCategories = Array.isArray(categoriesArray) ? categoriesArray : [];

  const handleBecomeVendor = () => {
    if (!token) {
      // Non connecté: aller à register
      navigate('/register');
    } else if (user?.data?.role === 'vendeur') {
      // Déjà vendeur: aller à l'espace vendeur
      navigate('/vendor/dashboard');
    } else {
      // Connecté mais pas vendeur: faire demande
      navigate('/vendor/request');
    }
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section Épurée */}
      <section className="bg-[#FF6B35] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Achetez et vendez en toute confiance
            </h1>
            <p className="text-xl mb-8 text-white/90">
              La marketplace ivoirienne qui connecte acheteurs et vendeurs
            </p>
            <Link
              to="/products"
              className="inline-block px-8 py-3 bg-white text-[#FF6B35] font-medium rounded-lg hover:bg-gray-50"
            >
              Parcourir les produits
            </Link>
          </div>
        </div>
      </section>

      {/* Stats simples */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">1000+</div>
              <div className="text-gray-600 mt-1">Produits</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">500+</div>
              <div className="text-gray-600 mt-1">Vendeurs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">10k+</div>
              <div className="text-gray-600 mt-1">Clients</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">98%</div>
              <div className="text-gray-600 mt-1">Satisfaits</div>
            </div>
          </div>
        </div>
      </section>

      {/* Catégories */}
      {allCategories.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Catégories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allCategories.slice(0, 6).map((category) => (
                <Link
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  className="p-6 border border-gray-200 rounded-lg hover:border-[#FF6B35] hover:shadow-md transition-all text-center"
                >
                  <div className="text-2xl mb-2">{category.icon || '📦'}</div>
                  <div className="font-medium text-gray-900">{category.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Produits en vedette */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Produits en vedette</h2>
              <Link to="/products" className="text-[#FF6B35] font-medium hover:underline">
                Voir tout →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Avantages */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Pourquoi choisir TYDA ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="font-bold text-xl mb-2">Sécurisé</h3>
              <p className="text-gray-600">
                Paiements sécurisés et protection des données
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="font-bold text-xl mb-2">Livraison rapide</h3>
              <p className="text-gray-600">
                Livraison dans toute la Côte d'Ivoire
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="font-bold text-xl mb-2">Support 24/7</h3>
              <p className="text-gray-600">
                Une équipe à votre écoute tous les jours
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2ECC71] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Devenez vendeur sur TYDA</h2>
          <p className="text-xl mb-8 text-white/90">
            Rejoignez notre communauté de vendeurs et développez votre business
          </p>
          <button
            onClick={handleBecomeVendor}
            className="inline-block px-8 py-3 bg-white text-[#2ECC71] font-medium rounded-lg hover:bg-gray-50"
          >
            Commencer maintenant
          </button>
        </div>
      </section>
    </div>
  );
}
