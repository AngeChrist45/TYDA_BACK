import { useQuery } from '@tanstack/react-query';
import { negotiationsApi } from '../lib/api';
import { Link } from 'react-router-dom';

export default function Negotiations() {
  const { data, isLoading } = useQuery({
    queryKey: ['negotiations'],
    queryFn: negotiationsApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const negotiations = data?.data?.data || data?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes Négociations</h1>

      {negotiations.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">💬</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Aucune négociation</h2>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas encore de négociations en cours
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-[#FF6B35] text-white rounded-lg font-medium hover:bg-[#e55a2b]"
          >
            Découvrir les produits
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {negotiations.map((negotiation) => (
            <div
              key={negotiation._id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {negotiation.product?.images?.[0]?.url ? (
                    <img
                      src={negotiation.product.images[0].url}
                      alt={negotiation.product.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      📦
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {negotiation.product?.title}
                  </h3>

                  <div className="flex items-center gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Prix initial:</span>
                      <span className="font-medium text-gray-900 ml-2">
                        {negotiation.originalPrice?.toLocaleString()} FCFA
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Votre offre:</span>
                      <span className="font-medium text-[#FF6B35] ml-2">
                        {negotiation.proposedPrice?.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        negotiation.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : negotiation.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : negotiation.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {negotiation.status === 'pending'
                        ? '⏳ En attente'
                        : negotiation.status === 'accepted'
                        ? '✅ Acceptée'
                        : negotiation.status === 'rejected'
                        ? '❌ Refusée'
                        : negotiation.status === 'counter'
                        ? '🔄 Contre-offre'
                        : negotiation.status}
                    </span>

                    {negotiation.status === 'pending' && (
                      <span className="text-sm text-gray-500">
                        En attente de la réponse du vendeur
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-2">
                    {new Date(negotiation.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                  {negotiation.status === 'counter' && negotiation.counterOffer && (
                    <div className="text-sm">
                      <span className="text-gray-600">Contre-offre:</span>
                      <div className="font-bold text-[#2ECC71]">
                        {negotiation.counterOffer.toLocaleString()} FCFA
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {negotiation.messages && negotiation.messages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <strong>Dernier message:</strong> {negotiation.messages[negotiation.messages.length - 1]?.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
