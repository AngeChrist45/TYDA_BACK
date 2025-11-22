import { Link } from 'react-router-dom';
import { Search, TrendingUp, Shield, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '../lib/api';

export default function Home() {
  const { data: products } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.getAll({ limit: 8 }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const featuredProducts = products?.data || [];
  const allCategories = categories?.data || [];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 gradient-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Découvrez les meilleurs
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                produits locaux
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Achetez, vendez et négociez en toute confiance sur TYDA - La marketplace ivoirienne 🇨🇮
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                to="/products"
                className="px-8 py-4 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
              >
                Parcourir les produits
              </Link>
              <Link
                to="/register"
                className="px-8 py-4 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-accent transition-all shadow-sm"
              >
                Devenir vendeur
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl gradient-card hover:shadow-lg transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4 shadow-md">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Négociation intelligente</h3>
              <p className="text-muted-foreground">
                Négociez les prix directement avec les vendeurs
              </p>
            </div>
            <div className="text-center p-6 rounded-xl gradient-card hover:shadow-lg transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-secondary mb-4 shadow-md">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Paiement sécurisé</h3>
              <p className="text-muted-foreground">
                Vos transactions sont 100% sécurisées
              </p>
            </div>
            <div className="text-center p-6 rounded-xl gradient-card hover:shadow-lg transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4 shadow-md">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Livraison rapide</h3>
              <p className="text-muted-foreground">
                Recevez vos commandes rapidement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {allCategories.length > 0 && (
        <section className="py-16 border-b">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Catégories populaires</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allCategories.slice(0, 6).map((category) => (
                <Link
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  className="group p-6 border rounded-lg hover:border-primary hover:shadow-lg transition-all"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{category.icon || '📦'}</div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Produits en vedette</h2>
              <Link to="/products" className="text-primary hover:underline">
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
