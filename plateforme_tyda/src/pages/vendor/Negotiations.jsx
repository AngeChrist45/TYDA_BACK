import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { vendorApi } from '../../lib/api';
import { Check, X, Loader2, MessageSquare, ArrowLeft, Clock, CheckCircle, XCircle, TrendingDown } from 'lucide-react';
import { useState } from 'react';

export default function VendorNegotiations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: negotiationsData, isLoading } = useQuery({
    queryKey: ['vendor-negotiations'],
    queryFn: vendorApi.getNegotiations,
  });

  const respondToNegotiation = useMutation({
    mutationFn: ({ id, action, counterOffer }) =>
      vendorApi.respondToNegotiation(id, action, counterOffer),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-negotiations']);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const negotiations = negotiationsData?.data || [];
  const pending = negotiations.filter((n) => n.status === 'pending');
  const responded = negotiations.filter((n) => n.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/vendor-dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Retour au dashboard</span>
        </button>

        <div>
          <h1 className="text-3xl font-bold mb-2">Négociations</h1>
          <p className="text-gray-600">{pending.length} négociation(s) en attente</p>
        </div>
      </div>

      {/* Pending negotiations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          En attente de réponse
        </h2>
        {pending.length === 0 ? (
          <div className="bg-white border-2 border-dashed rounded-lg p-12 text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">Aucune négociation en attente</p>
            <p className="text-sm text-gray-400">
              Les clients peuvent négocier sur vos produits activés
            </p>
          </div>
        ) : (
          pending.map((negotiation) => (
            <NegotiationCard
              key={negotiation._id}
              negotiation={negotiation}
              onRespond={(action, offer) => {
                respondToNegotiation.mutate({
                  id: negotiation._id,
                  action,
                  counterOffer: offer,
                });
              }}
              isPending={respondToNegotiation.isPending}
            />
          ))
        )}
      </div>

      {/* Previous negotiations */}
      {responded.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Historique
          </h2>
          {responded.map((negotiation) => (
            <NegotiationCard key={negotiation._id} negotiation={negotiation} readonly />
          ))}
        </div>
      )}
    </div>
  );
}

function NegotiationCard({ negotiation, onRespond, readonly, isPending }) {
  const [showCounter, setShowCounter] = useState(false);
  const [counterValue, setCounterValue] = useState('');

  const statusBadges = {
    pending: { icon: Clock, text: 'En attente', class: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    accepted: { icon: CheckCircle, text: 'Accepté', class: 'bg-green-100 text-green-800 border-green-300' },
    rejected: { icon: XCircle, text: 'Refusé', class: 'bg-red-100 text-red-800 border-red-300' },
    countered: { icon: TrendingDown, text: 'Contre-offre', class: 'bg-blue-100 text-blue-800 border-blue-300' }
  };

  const badge = statusBadges[negotiation.status] || statusBadges.pending;
  const StatusIcon = badge.icon;

  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">{negotiation.product?.title || 'Produit'}</h3>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${badge.class}`}>
              <StatusIcon className="h-3 w-3" />
              {badge.text}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Client: {negotiation.customer?.firstName} {negotiation.customer?.lastName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 mb-1">Prix initial</p>
          <p className="font-bold text-gray-900">{negotiation.originalPrice?.toLocaleString()} FCFA</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Proposition client</p>
          <p className="font-bold text-orange-600">{negotiation.proposedPrice?.toLocaleString()} FCFA</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Économie demandée</p>
          <p className="font-bold text-red-600">
            -{((1 - negotiation.proposedPrice / negotiation.originalPrice) * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {!readonly && (
        <div className="space-y-3">
          {!showCounter ? (
            <div className="flex gap-2">
              <button
                onClick={() => onRespond && onRespond('accept', null)}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                <CheckCircle className="h-5 w-5" />
                Accepter
              </button>
              <button
                onClick={() => setShowCounter(true)}
                disabled={isPending}
                className="px-4 py-3 border-2 border-orange-500 text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-all disabled:opacity-50"
              >
                Contre-offre
              </button>
              <button
                onClick={() => onRespond && onRespond('reject', null)}
                disabled={isPending}
                className="px-4 py-3 border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Votre contre-offre (FCFA)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={counterValue}
                  onChange={(e) => setCounterValue(e.target.value)}
                  placeholder={`Entre ${negotiation.proposedPrice} et ${negotiation.originalPrice}`}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  min={negotiation.proposedPrice}
                  max={negotiation.originalPrice}
                />
                <button
                  onClick={() => {
                    if (counterValue) {
                      onRespond && onRespond('counter', parseInt(counterValue));
                      setShowCounter(false);
                      setCounterValue('');
                    }
                  }}
                  disabled={isPending || !counterValue}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Envoyer
                </button>
                <button
                  onClick={() => {
                    setShowCounter(false);
                    setCounterValue('');
                  }}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {readonly && negotiation.counterOffer && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-xs text-orange-700 font-semibold mb-1">Votre contre-offre :</p>
          <p className="text-lg font-bold text-orange-900">{negotiation.counterOffer?.toLocaleString()} FCFA</p>
        </div>
      )}
    </div>
  );
}
