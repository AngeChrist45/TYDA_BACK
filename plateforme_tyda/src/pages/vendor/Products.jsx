import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi, categoriesApi } from '../../lib/api';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

export default function VendorProducts() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['vendor-products'],
    queryFn: vendorApi.getProducts,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const createProduct = useMutation({
    mutationFn: (data) => vendorApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-products']);
      setShowForm(false);
      alert('Produit créé!');
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => vendorApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-products']);
      setEditingProduct(null);
      setShowForm(false);
      alert('Produit mis à jour!');
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id) => vendorApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-products']);
      alert('Produit supprimé!');
    },
  });

  const products = productsData?.data || [];
  const categories = categoriesData?.data || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseInt(formData.get('price')),
      stock: parseInt(formData.get('stock')),
      category: formData.get('category'),
      negotiation: {
        enabled: formData.get('negotiable') === 'on',
        discountPercentage: parseInt(formData.get('discountPercentage') || 0),
      },
    };

    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct._id, data });
    } else {
      createProduct.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mes produits</h1>
          <p className="text-muted-foreground">{products.length} produit(s)</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          Nouveau produit
        </button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-6 bg-card">
          <h3 className="font-semibold text-lg mb-4">
            {editingProduct ? 'Modifier' : 'Nouveau'} produit
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom</label>
              <input
                name="name"
                defaultValue={editingProduct?.name}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                defaultValue={editingProduct?.description}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Prix (FCFA)</label>
                <input
                  name="price"
                  type="number"
                  defaultValue={editingProduct?.price}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stock</label>
                <input
                  name="stock"
                  type="number"
                  defaultValue={editingProduct?.stock}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Catégorie</label>
              <select
                name="category"
                defaultValue={editingProduct?.category?._id}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Sélectionner...</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t pt-4">
              <label className="flex items-center gap-2 mb-4">
                <input
                  name="negotiable"
                  type="checkbox"
                  defaultChecked={editingProduct?.negotiation?.enabled}
                  className="rounded"
                />
                <span className="font-medium">Activer la négociation</span>
              </label>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Pourcentage de réduction max (%)
                </label>
                <input
                  name="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={editingProduct?.negotiation?.discountPercentage || 0}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                {editingProduct ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-accent"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="border rounded-lg overflow-hidden">
            <div className="aspect-square bg-muted">
              {product.images?.[0] && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
              <p className="text-2xl font-bold text-primary mb-2">
                {product.price.toLocaleString()} FCFA
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Stock: {product.stock} | {product.category?.name}
              </p>
              {product.negotiation?.enabled && (
                <div className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-semibold inline-block mb-4">
                  Négociable -{product.negotiation.discountPercentage}%
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setShowForm(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg hover:bg-accent"
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
                  className="px-3 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
