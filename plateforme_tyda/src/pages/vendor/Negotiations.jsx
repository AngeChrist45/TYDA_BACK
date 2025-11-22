import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api';
import { Check, X, Loader2, MessageSquare } from 'lucide-react';
import { useState } from 'react';

export default function VendorNegotiations() {
  const queryClient = useQueryClient();
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [counterOffer, setCounterOffer] = useState('');

  const { data: negotiationsData, isLoading } = useQuery({
    queryKey: ['vendor-negotiations'],
    queryFn: vendorApi.getNegotiations,
  });

  const respondToNegotiation = useMutation({
    mutationFn: ({ id, action, counterOffer }) =>
      vendorApi.respondToNegotiation(id, action, counterOffer),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-negotiations']);
      setSelectedNegotiation(null);
      setCounterOffer('');
      alert('Réponse envoyée!');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const negotiations = negotiationsData?.data || [];
  const pending = negotiations.filter((n) => n.status === 'pending');
  const responded = negotiations.filter((n) => n.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Négociations</h1>
        <p className="text-muted-foreground">{pending.length} en attente</p>
      </div>

      {/* Pending negotiations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">En attente de réponse</h2>
        {pending.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune négociation en attente</p>
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
            />
          ))
        )}
      </div>

      {/* Previous negotiations */}
      {responded.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Historique</h2>
          {responded.map((negotiation) => (
            <NegotiationCard key={negotiation._id} negotiation={negotiation} readonly />
          ))}
        </div>
      )}
    </div>
  );
}

function NegotiationCard({ negotiation, onRespond, readonly }) {
  const [showCounter, setShowCounter] = useState(false);
  const [counterValue, setCounterValue] = useState('');

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    accepted: 'bg-secondary/10 text-secondary',
    rejected: 'bg-destructive/10 text-destructive',
    countered: 'bg-primary/10 text-primary',
  };

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{negotiation.product?.name}</h3>
          <p className="text-sm text-muted-foreground">
            De: {negotiation.customer?.firstName} {negotiation.customer?.lastName}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[negotiation.status]}`}>
          {negotiation.status === 'pending' ? 'En attente' :
           negotiation.status === 'accepted' ? 'Accepté' :
           negotiation.status === 'rejected' ? 'Refusé' : 'Contre-offre'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Prix original</p>
          <p className="font-bold">{negotiation.originalPrice?.toLocaleString()} FCFA</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Prix proposé</p>
          <p className="font-bold text-secondary">{negotiation.proposedPrice?.toLocaleString()} FCFA</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Réduction</p>
          <p className="font-bold text-destructive">
            -{(((negotiation.originalPrice - negotiation.proposedPrice) / negotiation.originalPrice) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {negotiation.counterOffer && (
        <div className="p-3 bg-primary/5 border rounded-lg mb-4">
          <p className="text-sm text-muted-foreground mb-1">Votre contre-offre</p>
          <p className="font-bold text-primary">{negotiation.counterOffer.toLocaleString()} FCFA</p>
        </div>
      )}

      {!readonly && negotiation.status === 'pending' && (
        <div className="space-y-3">
          {!showCounter ? (
            <div className="flex gap-2">
              <button
                onClick={() => onRespond('accept')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90"
              >
                <Check className="h-4 w-4" />
                Accepter
              </button>
              <button
                onClick={() => setShowCounter(true)}
                className="flex-1 px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary/10"
              >
                Contre-offre
              </button>
              <button
                onClick={() => onRespond('reject')}
                className="px-4 py-2 border-2 border-destructive text-destructive rounded-lg hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                value={counterValue}
                onChange={(e) => setCounterValue(e.target.value)}
                placeholder="Votre contre-offre"
                className="flex-1 px-4 py-2 border rounded-lg"
                min={negotiation.proposedPrice}
                max={negotiation.originalPrice}
              />
              <button
                onClick={() => {
                  onRespond('counter', parseInt(counterValue));
                  setShowCounter(false);
                  setCounterValue('');
                }}
                disabled={!counterValue}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                Envoyer
              </button>
              <button
                onClick={() => {
                  setShowCounter(false);
                  setCounterValue('');
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
