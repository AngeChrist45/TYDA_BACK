import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cartApi, ordersApi } from '../lib/api';

export default function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    region: '',
    notes: ''
  });

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
  });

  const cart = cartData?.data?.data;
  const items = cart?.items || [];
  
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  const shippingFee = subtotal > 0 ? 1000 : 0; // 1000 FCFA frais de livraison
  const total = subtotal + shippingFee;

  const createOrder = useMutation({
    mutationFn: async () => {
      const orderData = {
        shippingAddress: {
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          phone: shippingInfo.phone,
          street: shippingInfo.street,
          city: shippingInfo.city,
          region: shippingInfo.region
        },
        paymentMethod: 'cash_on_delivery', // Paiement à la livraison par défaut
        notes: shippingInfo.notes || ''
      };
      console.log('📦 Sending order data:', orderData);
      return ordersApi.create(orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      queryClient.invalidateQueries(['orders']);
      alert('✅ Commande validée avec succès !');
      navigate('/orders');
    },
    onError: (error) => {
      console.error('Erreur création commande:', error);
      console.error('Erreur détails:', error.response?.data);
      alert(`❌ Erreur: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!shippingInfo.firstName || !shippingInfo.lastName || !shippingInfo.phone || 
        !shippingInfo.street || !shippingInfo.city || !shippingInfo.region) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (items.length === 0) {
      alert('Votre panier est vide');
      return;
    }
    
    createOrder.mutate();
  };

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

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Votre panier est vide</h2>
        <p className="text-gray-600 mb-8">Ajoutez des produits avant de passer commande</p>
        <button
          onClick={() => navigate('/products')}
          className="px-8 py-3 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b]"
        >
          Continuer mes achats
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Finaliser la commande</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire de livraison */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Informations de livraison</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.firstName}
                    onChange={(e) => setShippingInfo({...shippingInfo, firstName: e.target.value})}
                    placeholder="Votre prénom"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6B35]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.lastName}
                    onChange={(e) => setShippingInfo({...shippingInfo, lastName: e.target.value})}
                    placeholder="Votre nom"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6B35]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={shippingInfo.phone}
                  onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                  placeholder="+225 XX XX XX XX XX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6B35]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rue / Adresse *
                </label>
                <textarea
                  value={shippingInfo.street}
                  onChange={(e) => setShippingInfo({...shippingInfo, street: e.target.value})}
                  placeholder="Numéro, rue, quartier..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6B35]"
                  rows="2"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville *
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                    placeholder="Abidjan, Yamoussoukro..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6B35]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Région / Commune *
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.region}
                    onChange={(e) => setShippingInfo({...shippingInfo, region: e.target.value})}
                    placeholder="Cocody, Plateau, Abobo..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6B35]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={shippingInfo.notes}
                  onChange={(e) => setShippingInfo({...shippingInfo, notes: e.target.value})}
                  placeholder="Instructions de livraison, commentaires..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6B35]"
                  rows="3"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Résumé de la commande */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Résumé</h2>
            
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item._id} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.images?.[0] && (
                      <img 
                        src={item.product.images[0].url || item.product.images[0]} 
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900 line-clamp-1">
                      {item.product?.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} × {item.price.toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span>{subtotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span>{shippingFee.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{total.toLocaleString()} FCFA</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={createOrder.isLoading}
              className="w-full py-3 bg-[#2ECC71] text-white font-medium rounded-lg hover:bg-[#27ae60] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createOrder.isLoading ? 'Validation...' : 'Valider la commande'}
            </button>

            <button
              onClick={() => navigate('/cart')}
              className="w-full mt-3 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
            >
              Retour au panier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
