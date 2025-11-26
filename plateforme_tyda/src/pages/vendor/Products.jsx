import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi, categoriesApi, authApi } from '../../lib/api';
import { Plus, Edit, Trash2, Loader2, Clock, CheckCircle, XCircle, Upload, X, Package, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VendorProducts() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [modal, setModal] = useState({ show: false, type: '', message: '' });

  // Vérifier que l'utilisateur est un vendeur approuvé
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await authApi.getCurrentUser();
      return response.data;
    },
  });

  const isApprovedVendor = profileData?.data?.user?.vendorInfo?.validationStatus === 'approved';

  useEffect(() => {
    if (profileData?.data?.user && !isApprovedVendor) {
      navigate('/profile');
    }
  }, [profileData, isApprovedVendor, navigate]);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['vendor-products'],
    queryFn: async () => {
      const response = await vendorApi.getProducts();
      console.log('🛍️ Produits vendeur response:', response);
      console.log('🛍️ response.data:', response.data);
      return response.data; // { success: true, data: { products: [...] } }
    },
    enabled: isApprovedVendor, // Ne charger que si vendeur approuvé
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const createProduct = useMutation({
    mutationFn: (data) => vendorApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-products']);
      queryClient.invalidateQueries(['vendor-dashboard']);
      setShowForm(false);
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setModal({ show: true, type: 'success', message: 'Produit soumis avec succès ! Il sera visible après validation par l\'admin.' });
    },
    onError: (error) => {
      setModal({ show: true, type: 'error', message: error.response?.data?.message || 'Erreur lors de la création du produit' });
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => vendorApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-products']);
      queryClient.invalidateQueries(['vendor-dashboard']);
      setEditingProduct(null);
      setShowForm(false);
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setModal({ show: true, type: 'success', message: 'Produit mis à jour ! Il sera re-validé par l\'admin.' });
    },
    onError: (error) => {
      setModal({ show: true, type: 'error', message: error.response?.data?.message || 'Erreur lors de la mise à jour du produit' });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id) => vendorApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-products']);
      queryClient.invalidateQueries(['vendor-dashboard']);
      setModal({ show: true, type: 'success', message: 'Produit supprimé avec succès !' });
    },
    onError: (error) => {
      setModal({ show: true, type: 'error', message: error.response?.data?.message || 'Erreur lors de la suppression du produit' });
    },
  });

  const products = productsData?.data?.products || [];
  const categories = categoriesData?.data?.data?.categories || [];

  console.log('📦 productsData:', productsData);
  console.log('📋 products array:', products);
  console.log('📦 Categories Data:', categoriesData);
  console.log('📋 Categories Array:', categories);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 5) {
      alert('Maximum 5 images autorisées');
      return;
    }
    
    setSelectedImages(prev => [...prev, ...files]);
    
    // Créer les previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrls(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      price: parseInt(formData.get('price')),
      quantity: parseInt(formData.get('quantity')),
      category: formData.get('category'),
      images: selectedImages,
    };

    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct._id, data });
    } else {
      createProduct.mutate(data);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      en_attente: {
        icon: Clock,
        text: 'En attente',
        class: 'bg-orange-100 text-orange-800 border-orange-300'
      },
      valide: {
        icon: CheckCircle,
        text: 'Validé',
        class: 'bg-green-100 text-green-800 border-green-300'
      },
      refuse: {
        icon: XCircle,
        text: 'Refusé',
        class: 'bg-red-100 text-red-800 border-red-300'
      }
    };
    
    const badge = badges[status] || badges.en_attente;
    const Icon = badge.icon;
    
    return (
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${badge.class}`}>
        <Icon className="h-3 w-3" />
        {badge.text}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si pas de données profile ou pas vendeur approuvé
  if (!isApprovedVendor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600">Accès réservé aux vendeurs approuvés</p>
          <button
            onClick={() => navigate('/profile')}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg"
          >
            Retour au profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec navigation */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/vendor-dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Retour au dashboard vendeur</span>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mes produits</h1>
          <p className="text-muted-foreground">{products.length} produit(s)</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
            setSelectedImages([]);
            setImagePreviewUrls([]);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
        >
          <Plus className="h-5 w-5" />
          Nouveau produit
        </button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-6 bg-white shadow-lg">
          <h3 className="font-semibold text-lg mb-4">
            {editingProduct ? 'Modifier' : 'Nouveau'} produit
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Titre du produit*</label>
              <input
                name="title"
                defaultValue={editingProduct?.title}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                placeholder="Ex: iPhone 13 Pro Max 256Go"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description*</label>
              <textarea
                name="description"
                defaultValue={editingProduct?.description}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                placeholder="Décrivez votre produit en détail..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Prix (FCFA)*</label>
                <input
                  name="price"
                  type="number"
                  min="0"
                  defaultValue={editingProduct?.price}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                  placeholder="10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quantité en stock*</label>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue={editingProduct?.inventory?.quantity}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                  placeholder="10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Catégorie*</label>
              {!Array.isArray(categories) || categories.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Aucune catégorie disponible. Contactez l'administrateur pour ajouter des catégories.
                  </p>
                </div>
              ) : (
                <select
                  name="category"
                  defaultValue={editingProduct?.category?._id}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner une catégorie...</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Upload d'images */}
            <div>
              <label className="block text-sm font-medium mb-2">Images (max 5)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Cliquez pour uploader des images</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG jusqu'à 5MB</p>
                </label>
              </div>
              
              {/* Preview des images */}
              {imagePreviewUrls.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img src={url} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
              <p className="font-semibold mb-1">📋 À noter :</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Votre produit sera soumis à validation par l'admin</li>
                <li>L'admin peut activer la négociation et définir le pourcentage</li>
                <li>Vous serez notifié de la décision de validation</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                type="submit"
                disabled={createProduct.isPending || updateProduct.isPending || !Array.isArray(categories) || categories.length === 0}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(createProduct.isPending || updateProduct.isPending) ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    En cours...
                  </span>
                ) : (
                  editingProduct ? 'Mettre à jour' : 'Soumettre le produit'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                  setSelectedImages([]);
                  setImagePreviewUrls([]);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="border rounded-lg overflow-hidden bg-white shadow-md hover:shadow-xl transition-all">
            <div className="aspect-square bg-gray-100 relative">
              {product.images?.[0]?.url ? (
                <img
                  src={product.images[0].url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Upload className="h-16 w-16" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                {getStatusBadge(product.status)}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2 line-clamp-2 text-gray-900">{product.title}</h3>
              <p className="text-2xl font-bold text-orange-600 mb-2">
                {product.price.toLocaleString()} FCFA
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Stock: {product.inventory?.quantity || 0} | {product.category?.name}
              </p>
              
              {/* Info négociation si activée */}
              {product.negotiation?.enabled && (
                <div className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-semibold inline-block mb-3">
                  ✨ Négociable -{product.negotiation.percentage}%
                </div>
              )}

              {/* Raison de refus */}
              {product.status === 'refuse' && product.validation?.rejectionReason && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  <p className="font-semibold">Raison du refus :</p>
                  <p>{product.validation.rejectionReason}</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setShowForm(true);
                    setSelectedImages([]);
                    setImagePreviewUrls([]);
                  }}
                  disabled={product.status === 'valide'}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
                <button
                  onClick={() => {
                    if (confirm('Supprimer ce produit?')) {
                      deleteProduct.mutate(product._id);
                    }
                  }}
                  disabled={product.status === 'valide'}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              {product.status === 'valide' && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Les produits validés ne peuvent pas être modifiés
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Aucun produit pour le moment</p>
          <p className="text-sm text-gray-400">
            Ajoutez vos premiers produits pour commencer à vendre
          </p>
        </div>
      )}

      {/* Modale de notification */}
      {modal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className={`p-6 rounded-t-xl ${modal.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-3">
                {modal.type === 'success' ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
                <h3 className={`text-xl font-bold ${modal.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                  {modal.type === 'success' ? 'Succès !' : 'Erreur'}
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">{modal.message}</p>
              <button
                onClick={() => setModal({ show: false, type: '', message: '' })}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  modal.type === 'success'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
