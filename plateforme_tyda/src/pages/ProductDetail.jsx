import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsApi, cartApi, favoritesApi, negotiationsApi } from '../lib/api';
import { 
  ArrowLeft, Heart, ShoppingCart, Share2, Star, Package, TrendingUp, 
  Truck, Shield, MessageCircle, Loader2, Check, Store, MapPin, Plus, Minus
} from 'lucide-react';
import { useState } from 'react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id),
  });

  const addToCart = useMutation({
    mutationFn: () => cartApi.add(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      alert('✅ Produit ajouté au panier!');
    },
  });

  const addToFavorites = useMutation({
    mutationFn: () => favoritesApi.add(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites']);
      alert('❤️ Ajouté aux favoris!');
    },
  });

  const createNegotiation = useMutation({
    mutationFn: (price) => negotiationsApi.create(id, price),
    onSuccess: () => {
      setShowNegotiation(false);
      alert('✅ Négociation envoyée!');
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-muted-foreground">Chargement du produit...</p>
      </div>
    );
  }

  const product = productData?.data;

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Produit introuvable</h2>
        <Link to="/products" className="text-primary hover:underline">
          Retour aux produits
        </Link>
      </div>
    );
  }

  const images = product.images || [];
  const rating = 4.5;
  const reviewsCount = 12;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors group"
      >
        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        Retour
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted shadow-2xl">
            {images[selectedImage] ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-32 w-32 text-muted-foreground" />
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === idx
                      ? 'border-primary shadow-lg'
                      : 'border-transparent hover:border-border'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            {product.negotiable && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-bold mb-3">
                <TrendingUp className="h-4 w-4" />
                Négociable
              </span>
            )}
            <h1 className="text-4xl font-bold mb-3">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                {rating} ({reviewsCount} avis)
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <div className="text-5xl font-bold text-primary">
                {product.price.toLocaleString()}
              </div>
              <div className="text-2xl text-muted-foreground">FCFA</div>
            </div>
          </div>

          <div className="p-6 bg-card border border-border rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Disponibilité:</span>
              <span className={`font-semibold ${product.stock > 10 ? 'text-secondary' : 'text-destructive'}`}>
                {product.stock > 10 ? (
                  <span className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    En stock ({product.stock})
                  </span>
                ) : (
                  `Stock limité (${product.stock})`
                )}
              </span>
            </div>

            {product.vendor && (
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-muted-foreground">Vendeur:</span>
                <Link
                  to={`/vendors/${product.vendor._id}`}
                  className="flex items-center gap-2 font-semibold hover:text-primary transition-colors"
                >
                  <Store className="h-5 w-5" />
                  {product.vendor.storeName || 'Vendeur vérifié'}
                </Link>
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground font-medium">Quantité:</span>
            <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="p-3 hover:bg-background rounded-lg transition-all disabled:opacity-50"
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="w-16 text-center font-bold text-xl">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="p-3 hover:bg-background rounded-lg transition-all disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => addToCart.mutate()}
              disabled={addToCart.isLoading || product.stock === 0}
              className="flex-1 py-4 gradient-primary text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {addToCart.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Ajouter au panier
                </>
              )}
            </button>

            <button
              onClick={() => addToFavorites.mutate()}
              disabled={addToFavorites.isLoading}
              className="p-4 border-2 border-border hover:border-primary rounded-xl transition-all hover:bg-primary/10"
            >
              <Heart className="h-6 w-6" />
            </button>

            <button className="p-4 border-2 border-border hover:border-primary rounded-xl transition-all hover:bg-primary/10">
              <Share2 className="h-6 w-6" />
            </button>
          </div>

          {product.negotiable && (
            <button
              onClick={() => setShowNegotiation(!showNegotiation)}
              className="w-full py-3 bg-secondary/10 text-secondary border-2 border-secondary rounded-xl font-semibold hover:bg-secondary/20 transition-all flex items-center justify-center gap-2"
            >
              <TrendingUp className="h-5 w-5" />
              Proposer un prix
            </button>
          )}

          {showNegotiation && (
            <div className="p-6 bg-card border-2 border-secondary rounded-2xl space-y-4 animate-in slide-in-from-top">
              <h3 className="font-bold text-lg">Négocier le prix</h3>
              <input
                type="number"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                placeholder="Votre proposition (FCFA)"
                className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <button
                onClick={() => createNegotiation.mutate(parseInt(proposedPrice))}
                disabled={!proposedPrice || createNegotiation.isLoading}
                className="w-full py-3 gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {createNegotiation.isLoading ? 'Envoi...' : 'Envoyer la proposition'}
              </button>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t">
            <div className="text-center p-4 bg-card rounded-xl">
              <Truck className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-semibold text-sm">Livraison</div>
              <div className="text-xs text-muted-foreground">Gratuite</div>
            </div>
            <div className="text-center p-4 bg-card rounded-xl">
              <Shield className="h-8 w-8 mx-auto mb-2 text-secondary" />
              <div className="font-semibold text-sm">Paiement</div>
              <div className="text-xs text-muted-foreground">Sécurisé</div>
            </div>
            <div className="text-center p-4 bg-card rounded-xl">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-semibold text-sm">Support</div>
              <div className="text-xs text-muted-foreground">24/7</div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">Description</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>
      )}
    </div>
  );
}
