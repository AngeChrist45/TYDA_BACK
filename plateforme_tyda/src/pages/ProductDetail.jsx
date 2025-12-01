import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { productsApi, cartApi, favoritesApi, negotiationsApi } from '../lib/api';
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../lib/api';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentNegotiationId, setCurrentNegotiationId] = useState(null);
  const [botTyping, setBotTyping] = useState(false);
  const [negotiationAccepted, setNegotiationAccepted] = useState(false);
  const [acceptedPrice, setAcceptedPrice] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const token = localStorage.getItem('tyda_token');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connexion Socket.IO
  useEffect(() => {
    if (showNegotiation && !socketRef.current) {
      const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://tyda-back.onrender.com';
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        console.log('🟢 Socket connecté');
      });

      socketRef.current.on('negotiation-message', (data) => {
        console.log('📨 Message reçu du bot:', data);
        setBotTyping(false);
        
        if (data.message) {
          setMessages(prev => [...prev, {
            from: 'bot',
            text: data.message,
            proposedPrice: data.proposedPrice,
            timestamp: new Date()
          }]);
        }
      });

      socketRef.current.on('negotiation-accepted', (data) => {
        console.log('✅ Négociation acceptée:', data);
        setBotTyping(false);
        setNegotiationAccepted(true);
        setAcceptedPrice(data.finalPrice);
        setMessages(prev => [...prev, {
          from: 'bot',
          text: data.message || `Excellent ! J'accepte votre proposition de ${data.finalPrice?.toLocaleString()} FCFA. 🎉`,
          proposedPrice: data.finalPrice,
          timestamp: new Date(),
          accepted: true
        }]);
      });

      socketRef.current.on('negotiation-rejected', (data) => {
        console.log('❌ Négociation rejetée:', data);
        setBotTyping(false);
        setMessages(prev => [...prev, {
          from: 'bot',
          text: data.message || 'Désolé, nous ne pouvons pas accepter cette offre.',
          timestamp: new Date()
        }]);
      });

      socketRef.current.on('disconnect', () => {
        console.log('🔴 Socket déconnecté');
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [showNegotiation, token]);

  // Auto-ouvrir la négociation si #negotiate dans l'URL
  useEffect(() => {
    if (location.hash === '#negotiate') {
      setShowNegotiation(true);
      // Scroller jusqu'au formulaire
      setTimeout(() => {
        document.getElementById('negotiation-form')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.hash]);

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id),
  });

  const addToCart = useMutation({
    mutationFn: () => cartApi.add(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.refetchQueries({ queryKey: ['cart'] });
      alert('✅ Produit ajouté au panier avec succès !');
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        alert('❌ Erreur lors de l\'ajout au panier');
      }
    }
  });

  const addNegotiatedToCart = useMutation({
    mutationFn: () => cartApi.add(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.refetchQueries({ queryKey: ['cart'] });
      alert(`✅ Produit ajouté au panier au prix négocié de ${acceptedPrice?.toLocaleString()} FCFA !`);
      setShowNegotiation(false);
      setMessages([]);
      setCurrentNegotiationId(null);
      setNegotiationAccepted(false);
      setAcceptedPrice(null);
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        alert('❌ Erreur lors de l\'ajout au panier');
      }
    }
  });

  const addToFavorites = useMutation({
    mutationFn: () => favoritesApi.add(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites']);
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  });

  const startNegotiation = useMutation({
    mutationFn: async (price) => {
      console.log('🔵 Envoi négociation:', { productId: id, proposedPrice: price });
      const response = await api.post('/negotiations', {
        productId: id,
        proposedPrice: price
      });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Négociation créée:', data);
      const negotiation = data?.data?.negotiation || data?.data;
      const botResponse = data?.data?.botResponse;
      
      if (negotiation?._id) {
        setCurrentNegotiationId(negotiation._id);
        
        // Si on a déjà une réponse du bot, l'afficher immédiatement
        if (botResponse && botResponse.message) {
          console.log('🤖 Réponse immédiate du bot:', botResponse);
          setBotTyping(false);
          setMessages(prev => [...prev, {
            from: 'bot',
            text: botResponse.message,
            proposedPrice: botResponse.proposedPrice,
            timestamp: new Date(),
            accepted: botResponse.status === 'accepted'
          }]);
        } else {
          // Sinon, attendre la réponse via Socket.IO
          setBotTyping(true);
        }
        
        // Rejoindre la room de négociation via socket
        if (socketRef.current) {
          socketRef.current.emit('join-negotiation', negotiation._id);
          console.log('🤝 Rejoint la room:', negotiation._id);
        }
      }
      queryClient.invalidateQueries(['negotiations']);
    },
    onError: (error) => {
      console.error('❌ Erreur négociation:', error);
      setMessages(prev => [...prev, {
        from: 'bot',
        text: 'Erreur lors de la création de la négociation. Veuillez réessayer.',
        timestamp: new Date()
      }]);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  });

  const handleStartNegotiation = (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    if (!proposedPrice || parseFloat(proposedPrice) <= 0) {
      return;
    }
    startNegotiation.mutate();
  };

  // Extraire les données du produit
  const product = productData?.data?.data?.product || productData?.data?.product || productData?.data;
  console.log('🔍 Product exists:', !!product);
  console.log('🔍 Product title:', product?.title);
  console.log('🔍 Product price:', product?.price);
  console.log('🔍 Product images:', product?.images);
  console.log('🔍 Images length:', product?.images?.length);
  const images = product?.images?.map(img => img.url || img) || [];
  console.log('🔍 Mapped images:', images);
  const rating = product?.stats?.averageRating || 0;
  const reviewsCount = product?.stats?.reviewCount || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold mb-4">Produit introuvable</h2>
          <Link to="/products" className="text-[#FF6B35] hover:underline">
            Retour aux produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900 mb-6"
        >
          ← Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Images */}
          <div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              {images[selectedImage] && (
                <img
                  src={images[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-[#FF6B35]' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
            
            {rating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-gray-600">({reviewsCount} avis)</span>
              </div>
            )}

            <div className="border-t border-b border-gray-200 py-6 mb-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {product.price?.toLocaleString()} FCFA
              </div>
              {product.negotiation?.enabled && (
                <p className="text-[#2ECC71] font-medium">
                  Prix négociable
                </p>
              )}
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed">
              {product.description}
            </p>

            {/* Informations détaillées du produit */}
            <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-3">Informations</h3>
              
              {product.category && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Catégorie:</span>
                  <span className="font-medium text-gray-900">{product.category.name}</span>
                </div>
              )}

              {product.specifications?.brand && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Marque:</span>
                  <span className="font-medium text-gray-900">{product.specifications.brand}</span>
                </div>
              )}

              {product.specifications?.model && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Modèle:</span>
                  <span className="font-medium text-gray-900">{product.specifications.model}</span>
                </div>
              )}

              {product.specifications?.color && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Couleur:</span>
                  <span className="font-medium text-gray-900">{product.specifications.color}</span>
                </div>
              )}

              {product.specifications?.size && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Taille:</span>
                  <span className="font-medium text-gray-900">{product.specifications.size}</span>
                </div>
              )}

              {product.specifications?.weight && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Poids:</span>
                  <span className="font-medium text-gray-900">{product.specifications.weight}g</span>
                </div>
              )}

              {product.customAttributes && product.customAttributes.length > 0 && (
                <>
                  {product.customAttributes.map((attr, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-600">{attr.name}:</span>
                      <span className="font-medium text-gray-900">{attr.value}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Disponibilité:</span>
                <span className="font-medium text-gray-900">
                  {product.inventory?.quantity > 10 ? 'En stock' : `Stock limité (${product.inventory?.quantity || 0})`}
                </span>
              </div>

              {product.vendor && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Vendeur:</span>
                  <Link
                    to={`/vendors/${product.vendor._id}`}
                    className="font-medium text-[#FF6B35] hover:underline"
                  >
                    {product.vendor.vendorInfo?.businessName || 
                     `${product.vendor.firstName} ${product.vendor.lastName}`}
                  </Link>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-gray-600">Quantité:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  −
                </button>
                <span className="px-6 py-2 border-x border-gray-300 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.inventory?.quantity || 1, quantity + 1))}
                  disabled={quantity >= (product.inventory?.quantity || 1)}
                  className="px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (!token) {
                    navigate('/login');
                    return;
                  }
                  addToCart.mutate();
                }}
                disabled={addToCart.isLoading || !product.inventory?.quantity}
                className="w-full py-3 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#e55a2b] disabled:opacity-50"
              >
                {addToCart.isLoading ? 'Ajout en cours...' : 'Ajouter au panier'}
              </button>

              <button
                onClick={() => {
                  if (!token) {
                    navigate('/login');
                    return;
                  }
                  addToFavorites.mutate();
                }}
                className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Ajouter aux favoris
              </button>

              {product.negotiation?.enabled && (
                <button
                  onClick={() => {
                    if (!token) {
                      navigate('/login');
                      return;
                    }
                    setShowNegotiation(true);
                  }}
                  className="w-full py-3 bg-[#2ECC71] text-white font-medium rounded-lg hover:bg-[#27ae60]"
                >
                  Négocier le prix
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de négociation */}
      {showNegotiation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* En-tête avec info produit */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Négociation</h3>
                <button
                  onClick={() => {
                    setShowNegotiation(false);
                    setMessages([]);
                    setCurrentMessage('');
                    setProposedPrice('');
                    setCurrentNegotiationId(null);
                    setBotTyping(false);
                    if (socketRef.current) {
                      socketRef.current.disconnect();
                      socketRef.current = null;
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {images[0] && (
                    <img src={images[0]} alt={product.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{product.title}</h4>
                  <p className="text-2xl font-bold text-[#FF6B35]">
                    {product.price?.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </div>

            {/* Zone de chat */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">💬</div>
                  <p>Proposez un prix pour commencer la négociation</p>
                  <p className="text-sm mt-2">Le bot vous répondra instantanément</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.from === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.from === 'customer'
                            ? 'bg-[#FF6B35] text-white'
                            : msg.accepted
                            ? 'bg-[#2ECC71] text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        {msg.proposedPrice && (
                          <p className="text-lg font-bold mt-1">
                            {msg.proposedPrice.toLocaleString()} FCFA
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {botTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Bouton Ajouter au panier si la négociation est acceptée */}
                  {negotiationAccepted && (
                    <div className="flex justify-center">
                      <button
                        onClick={() => addNegotiatedToCart.mutate()}
                        disabled={addNegotiatedToCart.isLoading}
                        className="bg-[#2ECC71] hover:bg-[#27AE60] text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {addNegotiatedToCart.isLoading ? 'Ajout...' : `Ajouter au panier (${acceptedPrice?.toLocaleString()} FCFA)`}
                      </button>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Zone de saisie */}
            <div className="p-6 border-t border-gray-200 bg-white">
              {!negotiationAccepted && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!proposedPrice || parseFloat(proposedPrice) <= 0) {
                    console.log('⚠️ Prix invalide:', proposedPrice);
                    return;
                  }
                  
                  const price = parseFloat(proposedPrice);
                  console.log('💰 Prix saisi:', price, 'Product ID:', id);
                  const newMessage = {
                    from: 'customer',
                    text: 'Je propose un prix de :',
                    proposedPrice: price,
                    timestamp: new Date(),
                  };
                  
                  setMessages([...messages, newMessage]);
                  setProposedPrice(''); // Vider le champ tout de suite
                  
                  // Si c'est la première proposition, créer la négociation
                  if (!currentNegotiationId) {
                    setBotTyping(true);
                    startNegotiation.mutate(price); // Passer le prix en paramètre
                  } else {
                    // Sinon, envoyer via socket
                    if (socketRef.current) {
                      socketRef.current.emit('negotiate-message', {
                        negotiationId: currentNegotiationId,
                        message: `Je propose ${price.toLocaleString()} FCFA`,
                        proposedPrice: price,
                        sessionId: socketRef.current.id,
                        userId: socketRef.current.user?.id
                      });
                      setBotTyping(true);
                    }
                  }
                }}
                className="space-y-3"
              >
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder="Proposez un prix (FCFA)"
                    min="1"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2ECC71] focus:ring-2 focus:ring-[#2ECC71] focus:ring-opacity-20"
                  />
                  <button
                    type="submit"
                    disabled={!proposedPrice || startNegotiation.isLoading}
                    className="px-6 py-3 bg-[#2ECC71] text-white font-medium rounded-lg hover:bg-[#27ae60] disabled:opacity-50 flex items-center gap-2"
                  >
                    {startNegotiation.isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      '➤'
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Le vendeur recevra votre proposition et pourra y répondre
                </p>
              </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
