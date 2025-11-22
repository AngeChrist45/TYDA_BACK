import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '../lib/api';
import { Filter, Loader2 } from 'lucide-react';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { category: selectedCategory, search: searchParams.get('search') }],
    queryFn: () => productsApi.getAll({ 
      category: selectedCategory,
      search: searchParams.get('search'),
    }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const products = productsData?.data || [];
  const categories = categoriesData?.data || [];

  const filteredProducts = products.filter(p => 
    p.price >= priceRange[0] && p.price <= priceRange[1]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20 space-y-6">
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtres
              </h3>
            </div>

            <div>
              <h4 className="font-medium mb-3">Catégories</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    !selectedCategory ? 'bg-primary text-white' : 'hover:bg-accent'
                  }`}
                >
                  Toutes
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat._id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === cat._id ? 'bg-primary text-white' : 'hover:bg-accent'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Prix</h4>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="1000000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Jusqu'à {priceRange[1].toLocaleString()} FCFA
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Produits</h1>
            <p className="text-muted-foreground">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun produit trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
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
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-primary">
              {product.price.toLocaleString()} FCFA
            </span>
            {hasNegotiation && (
              <p className="text-xs text-muted-foreground">
                À partir de {(product.price * (1 - product.negotiation.discountPercentage / 100)).toLocaleString()} FCFA
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
