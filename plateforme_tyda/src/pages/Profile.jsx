import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, vendorApi } from '../lib/api';
import { User, MapPin, Phone, Mail, Store, Loader2 } from 'lucide-react';

export default function Profile() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showVendorRequest, setShowVendorRequest] = useState(false);
  const [formData, setFormData] = useState({});

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
  });

  const updateProfile = useMutation({
    mutationFn: (data) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setIsEditing(false);
      alert('Profil mis à jour');
    },
  });

  const requestVendor = useMutation({
    mutationFn: (data) => vendorApi.requestVendor(data),
    onSuccess: () => {
      alert('Demande envoyée! Vous serez notifié une fois approuvé.');
      setShowVendorRequest(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const profile = profileData?.data;
  const isVendor = profile?.role === 'vendeur';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Mon Profil</h1>

      <div className="space-y-6">
        {/* Informations personnelles */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Informations personnelles</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 border rounded-lg hover:bg-accent"
            >
              {isEditing ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfile.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Prénom"
                  defaultValue={profile.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Nom"
                  defaultValue={profile.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                defaultValue={profile.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="tel"
                placeholder="Téléphone"
                defaultValue={profile.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Enregistrer
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <span>{profile.firstName} {profile.lastName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>{profile.phone}</span>
              </div>
            </div>
          )}
        </div>

        {/* Devenir vendeur */}
        {!isVendor && (
          <div className="border rounded-lg p-6 bg-gradient-to-br from-secondary/5 to-primary/5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-secondary/10 rounded-lg">
                <Store className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Devenez vendeur sur TYDA</h3>
                <p className="text-muted-foreground mb-4">
                  Rejoignez notre communauté de vendeurs et commencez à vendre vos produits dès aujourd'hui.
                </p>
                {!showVendorRequest ? (
                  <button
                    onClick={() => setShowVendorRequest(true)}
                    className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90"
                  >
                    Faire une demande
                  </button>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      requestVendor.mutate({
                        businessName: formData.get('businessName'),
                        businessDescription: formData.get('businessDescription'),
                        businessAddress: formData.get('businessAddress'),
                      });
                    }}
                    className="space-y-4"
                  >
                    <input
                      name="businessName"
                      placeholder="Nom de l'entreprise"
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                    <textarea
                      name="businessDescription"
                      placeholder="Description de votre activité"
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                    <input
                      name="businessAddress"
                      placeholder="Adresse"
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90"
                      >
                        Envoyer
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowVendorRequest(false)}
                        className="px-4 py-2 border rounded-lg hover:bg-accent"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
