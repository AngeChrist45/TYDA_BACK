import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '../lib/api';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, List, Loader2, Package, Star, Heart, ShoppingCart, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', searchParams.toString()],
    queryFn: () => productsApi.getAll(Object.fromEntries(searchParams)),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

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

  const products = productsData?.data?.products || [];
  const categories = categoriesData?.data || [];
  const activeCategory = searchParams.get('category');

  if (productsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Chargement des produits...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Nos Produits</h1>
        <p className="text-muted-foreground text-lg">Découvrez notre sélection de produits de qualité 🇨🇮</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-lg">
        <form onSubmit={handleSearch} className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg"
          >
            Rechercher
          </button>
        </form>

        {/* Categories */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Catégories:
          </div>
          <button
            onClick={() => handleCategoryFilter(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              !activeCategory
                ? 'gradient-primary text-white shadow-md'
                : 'bg-muted hover:bg-accent'
            }`}
          >
            Toutes
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategoryFilter(category._id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeCategory === category._id
                  ? 'gradient-primary text-white shadow-md'
                  : 'bg-muted hover:bg-accent'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* View Toggle & Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">{products.length}</span> produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid' ? 'bg-primary text-white' : 'bg-muted hover:bg-accent'
            }`}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-primary text-white' : 'bg-muted hover:bg-accent'
            }`}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Products Grid/List */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Aucun produit trouvé</h3>
          <p className="text-muted-foreground">Essayez de modifier vos filtres de recherche</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {products.map((product) => (
            <ProductCard key={product._id} product={product} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, viewMode }) {
  const isGrid = viewMode === 'grid';
  
  return (
    <Link
      to={`/products/${product._id}`}
      className={`group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${
        isGrid ? 'flex flex-col' : 'flex gap-4 p-4'
      }`}
    >
      <div className={`relative overflow-hidden bg-muted ${
        isGrid ? 'aspect-square' : 'w-48 h-48 flex-shrink-0 rounded-xl'
      }`}>
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        
        {product.negotiable && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Négociable
          </div>
        )}
        
        {product.stock < 10 && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-xs font-bold shadow-lg">
            Stock limité
          </div>
        )}

        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.preventDefault(); }}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
          >
            <Heart className="h-5 w-5 text-foreground" />
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); }}
            className="p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-110"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className={`${isGrid ? 'p-4' : 'flex-1'}`}>
        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">(4.0)</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-primary">
              {product.price.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">FCFA</div>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">Stock: </span>
            <span className="font-semibold">{product.stock}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
