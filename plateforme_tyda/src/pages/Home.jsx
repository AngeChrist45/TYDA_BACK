import { Link } from 'react-router-dom';
import { Search, TrendingUp, Shield, Truck, Star, Heart, ShoppingCart, ArrowRight, Sparkles, Package, Users, BadgeCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '../lib/api';
import { useState } from 'react';

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
      {/* Hero Section avec animation */}
      <section className="relative overflow-hidden py-24 gradient-hero">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6 inline-flex items-center gap-2 px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium shadow-lg animate-bounce">
              <Sparkles className="h-5 w-5" />
              Bienvenue sur TYDA 🇨🇮
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
              Découvrez les meilleurs
              <span className="block mt-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent animate-pulse">
                produits locaux
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
              Achetez, vendez et négociez en toute confiance sur la marketplace ivoirienne
            </p>
            
            <div className="flex gap-4 flex-wrap justify-center">
              <Link
                to="/products"
                className="group px-8 py-4 bg-white text-primary rounded-xl font-bold hover:shadow-2xl hover:-translate-y-1 transition-all shadow-lg flex items-center gap-2"
              >
                Parcourir les produits
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/register"
                className="px-8 py-4 border-2 border-white/30 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/10 hover:shadow-xl transition-all shadow-lg"
              >
                Devenir vendeur
              </Link>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gradient-to-b from-accent/50 to-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, label: 'Utilisateurs actifs', value: '10K+', color: 'text-primary' },
              { icon: Package, label: 'Produits disponibles', value: '5K+', color: 'text-secondary' },
              { icon: BadgeCheck, label: 'Vendeurs vérifiés', value: '500+', color: 'text-primary' },
              { icon: Star, label: 'Avis positifs', value: '98%', color: 'text-yellow-500' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center p-6 bg-card border border-border rounded-2xl hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                <stat.icon className={`h-12 w-12 mx-auto mb-4 ${stat.color} group-hover:scale-110 transition-transform`} />
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-b">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Pourquoi choisir TYDA ?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une expérience d'achat unique, conçue pour vous
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: 'Négociation intelligente',
                description: 'Négociez les prix directement avec les vendeurs et obtenez les meilleurs deals',
                gradient: 'gradient-primary'
              },
              {
                icon: Shield,
                title: 'Paiement sécurisé',
                description: 'Vos transactions sont 100% sécurisées avec notre système de paiement',
                gradient: 'gradient-secondary'
              },
              {
                icon: Truck,
                title: 'Livraison rapide',
                description: 'Recevez vos commandes rapidement partout en Côte d\'Ivoire',
                gradient: 'gradient-primary'
              }
            ].map((feature, idx) => (
              <div key={idx} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative p-8 bg-card border border-border rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${feature.gradient} mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {allCategories.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-accent/30 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Catégories populaires</h2>
              <p className="text-xl text-muted-foreground">Explorez nos différentes catégories</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {allCategories.slice(0, 6).map((category) => (
                <Link
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  className="group relative"
                >
                  <div className="absolute inset-0 gradient-card rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all"></div>
                  <div className="relative p-8 bg-card border border-border rounded-2xl hover:border-primary hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                    <div className="text-center">
                      <div className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-300">
                        {category.icon || '📦'}
                      </div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold mb-2">Produits en vedette</h2>
                <p className="text-muted-foreground text-lg">Découvrez nos meilleures offres</p>
              </div>
              <Link 
                to="/products" 
                className="group flex items-center gap-2 px-6 py-3 gradient-primary text-white rounded-xl font-semibold hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                Voir tout
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
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

      {/* CTA Section */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Prêt à vendre vos produits ?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Rejoignez des centaines de vendeurs et développez votre business avec TYDA
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-bold hover:shadow-2xl hover:-translate-y-1 transition-all shadow-lg"
            >
              Devenir vendeur maintenant
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasNegotiation = product.negotiation?.enabled && product.negotiation?.discountPercentage > 0;

  return (
    <Link
      to={`/products/${product._id}`}
      className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
        {hasNegotiation && (
          <div className="absolute top-3 right-3 px-3 py-1 gradient-secondary text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm animate-pulse">
            🔥 -{product.negotiation.discountPercentage}%
          </div>
        )}
        
        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <button className="p-2 bg-white rounded-full hover:scale-110 transition-all shadow-lg">
              <Heart className="h-5 w-5 text-primary" />
            </button>
            <button className="p-2 bg-white rounded-full hover:scale-110 transition-all shadow-lg">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
          {product.name}
        </h3>
        
        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1">
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
            <span className="text-sm text-muted-foreground ml-1">
              ({product.rating.toFixed(1)})
            </span>
          </div>
        )}
        
        {/* Price */}
        <div className="pt-3 border-t border-border">
          <div className="text-2xl font-bold text-primary">
            {product.price.toLocaleString()} FCFA
          </div>
          {hasNegotiation && (
            <p className="text-sm text-muted-foreground">
              À partir de {Math.round(product.price * (1 - product.negotiation.discountPercentage / 100)).toLocaleString()} FCFA
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
