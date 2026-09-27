
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Plus, Trash2, Pencil, X, Save, Package, RefreshCw,
} from 'lucide-react';

const API_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const emptyForm = {
  name: '',
  category: '',
  price: '',
  image: '',
  subtitle: '',
  reference: '',
  description: '',
  stock: 0,
  isActive: true,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const token = () => localStorage.getItem('token');

  // ==========================================
  // CHARGER LES PRODUITS
  // ==========================================

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${API_URL}/products`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });

      setProducts(res.data?.products || res.data || []);
    } catch (err) {
      console.error(
        'Erreur produits:',
        err.response?.data || err.message
      );

      setError('Erreur lors du chargement des produits.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ==========================================
  // CHANGEMENT DES CHAMPS
  // ==========================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((f) => ({
      ...f,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));
  };

  // ==========================================
  // NOUVEAU PRODUIT
  // ==========================================

  const openCreate = () => {
    setForm({
      ...emptyForm,
    });

    setEditingId(null);
    setShowForm(true);
  };

  // ==========================================
  // MODIFIER UN PRODUIT
  // ==========================================

  const openEdit = (p) => {
    setForm({
      name: p.name || '',
      category: p.category || '',
      price: p.price ?? '',
      image: p.image || '',
      subtitle: p.subtitle || '',
      reference: p.reference || '',
      description: p.description || '',
      stock: p.stock ?? 0,
      isActive: p.isActive !== false,
    });

    setEditingId(p.id);
    setShowForm(true);
  };

  // ==========================================
  // UPLOAD IMAGE
  // ==========================================

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Vérification simple côté frontend
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une vraie image.');
      e.target.value = '';
      return;
    }

    const formData = new FormData();

    // IMPORTANT :
    // Le backend attend le champ "images"
    formData.append('images', file);

    try {
      setUploadingImage(true);

      const res = await axios.post(
        `${API_URL}/images`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token()}`,
          },
        }
      );

      const uploadedImage = res.data?.[0];

      if (!uploadedImage?.url) {
        throw new Error(
          "L'URL de l'image est introuvable."
        );
      }

      // L'URL retournée par le backend
      // est automatiquement placée dans le formulaire
      setForm((prev) => ({
        ...prev,
        image: uploadedImage.url,
      }));

      alert('Image envoyée avec succès ✅');

    } catch (err) {
      console.error(
        'Erreur upload image:',
        err.response?.data || err.message
      );

      alert(
        err.response?.data?.message ||
        "Impossible d'envoyer l'image."
      );
    } finally {
      setUploadingImage(false);

      // Permet de sélectionner à nouveau
      // la même image si nécessaire
      e.target.value = '';
    }
  };

  // ==========================================
  // ENREGISTRER LE PRODUIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.category ||
      !form.image ||
      form.price === ''
    ) {
      alert(
        'Nom, catégorie, prix et image sont obligatoires.'
      );
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),

      category: form.category
        .trim()
        .toLowerCase(),

      price: Number(form.price),

      image: form.image.trim(),

      subtitle: form.subtitle.trim(),

      description: form.description.trim(),

      stock: Number(form.stock) || 0,

      isActive: !!form.isActive,
    };

    // Ne pas envoyer une référence vide
    if (form.reference.trim()) {
      payload.reference =
        form.reference.trim();
    }

    try {
      if (editingId) {
        await axios.put(
          `${API_URL}/products/${editingId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token()}`,
            },
          }
        );
      } else {
        await axios.post(
          `${API_URL}/products`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token()}`,
            },
          }
        );
      }

      setShowForm(false);

      setForm({
        ...emptyForm,
      });

      setEditingId(null);

      await fetchProducts();

      alert(
        editingId
          ? 'Produit modifié avec succès ✅'
          : 'Produit créé avec succès ✅'
      );

    } catch (err) {
      console.error(
        'Erreur sauvegarde:',
        err.response?.data || err.message
      );

      alert(
        err.response?.data?.message ||
        'Erreur lors de la sauvegarde.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // SUPPRIMER / DÉSACTIVER
  // ==========================================

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        'Supprimer définitivement ce produit ?'
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/products/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token()}`,
          },
        }
      );

      setProducts((prev) =>
        prev.filter(
          (p) => p.id !== id
        )
      );

    } catch (err) {
      console.error(
        'Erreur suppression:',
        err.response?.data || err.message
      );

      alert(
        err.response?.data?.message ||
        'Erreur lors de la suppression.'
      );
    }
  };

  // ==========================================
  // STYLES
  // ==========================================

  const inputCls =
    'w-full bg-white border border-[#9E6B6B]/30 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#9E6B6B]';

  const labelCls =
    'text-[10px] font-mono text-neutral-600 uppercase tracking-widest block mb-1';

  // ==========================================
  // AFFICHAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-6 sm:px-10">

      <div className="max-w-6xl mx-auto space-y-8">

        {/* ================================
            HEADER
        ================================= */}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#9E6B6B]/30 pb-6">

          <div>

            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#9E6B6B]">
              Administration
            </span>

            <h1 className="text-3xl font-serif font-light">
              Gestion des Produits
            </h1>

          </div>

          <div className="flex items-center gap-3">
<button
  onClick={() => window.history.back()}
  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono uppercase tracking-widest transition-colors"
>
  Retour
</button>
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-mono uppercase tracking-widest cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={
                  loading
                    ? 'animate-spin'
                    : ''
                }
              />

              Rafraîchir
            </button>

            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-[#9E6B6B] hover:bg-[#8A5A5A] text-xs font-mono uppercase tracking-widest cursor-pointer"
            >
              <Plus size={14} />

              Nouveau produit
            </button>

          </div>

        </div>

        {/* ================================
            FORMULAIRE
        ================================= */}

        {showForm && (

          <form
            onSubmit={handleSubmit}
            className="bg-[#FCFAFA] text-neutral-900 border border-[#9E6B6B]/30 p-6 shadow-2xl space-y-4"
          >

            <div className="flex justify-between items-center border-b border-[#9E6B6B]/20 pb-3">

              <h2 className="text-lg font-serif">

                {editingId
                  ? 'Modifier le produit'
                  : 'Créer un produit'}

              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="text-neutral-500 hover:text-black cursor-pointer"
              >
                <X size={18} />
              </button>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* NOM */}

              <div>

                <label className={labelCls}>
                  Nom *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputCls}
                />

              </div>

              {/* CATÉGORIE */}

              <div>

                <label className={labelCls}>
                  Catégorie / Collection *
                </label>

                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="ex : solaire, vue, enfant"
                  className={inputCls}
                />

              </div>

              {/* PRIX */}

              <div>

                <label className={labelCls}>
                  Prix (€) *
                </label>

                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={handleChange}
                  className={inputCls}
                />

              </div>

              {/* STOCK */}

              <div>

                <label className={labelCls}>
                  Stock
                </label>

                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={handleChange}
                  className={inputCls}
                />

              </div>

              {/* ==========================
                  IMAGE
              =========================== */}

              <div className="sm:col-span-2">

                <label className={labelCls}>
                  Image du produit *
                </label>

                <div className="flex flex-col gap-3">

                  <label
                    className={`${inputCls} cursor-pointer text-center hover:border-[#9E6B6B] transition-colors`}
                  >

                    {uploadingImage
                      ? 'Envoi de l’image...'
                      : '📷 Choisir une image depuis le téléphone ou l’ordinateur'}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />

                  </label>

                  {/* APERÇU */}

                  {form.image && (

                    <div className="flex items-center gap-4">

                      <img
                        src={form.image}
                        alt="Aperçu"
                        className="w-24 h-24 object-contain bg-[#EAE4E1] p-2 border border-[#9E6B6B]/20"
                      />

                      <div className="text-[10px] font-mono text-neutral-500 break-all">
                        Image sélectionnée
                      </div>

                    </div>

                  )}

                </div>

              </div>

              {/* RÉFÉRENCE */}

              <div>

                <label className={labelCls}>
                  Référence
                </label>

                <input
                  name="reference"
                  value={form.reference}
                  onChange={handleChange}
                  placeholder="laissé vide = aucune référence"
                  className={inputCls}
                />

              </div>

              {/* SOUS-TITRE */}

              <div>

                <label className={labelCls}>
                  Sous-titre
                </label>

                <input
                  name="subtitle"
                  value={form.subtitle}
                  onChange={handleChange}
                  className={inputCls}
                />

              </div>

              {/* DESCRIPTION */}

              <div className="sm:col-span-2">

                <label className={labelCls}>
                  Description
                </label>

                <textarea
                  name="description"
                  rows="3"
                  value={form.description}
                  onChange={handleChange}
                  className={inputCls}
                />

              </div>

            </div>

            {/* ACTIF */}

            <label className="flex items-center gap-2 text-xs">

              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />

              Visible sur le site (actif)

            </label>

            {/* BOUTON */}

            <button
              type="submit"
              disabled={
                saving ||
                uploadingImage
              }
              className="flex items-center gap-2 bg-[#9E6B6B] hover:bg-[#8A5A5A] text-white px-6 py-3 text-xs font-mono uppercase tracking-widest cursor-pointer disabled:opacity-50"
            >

              <Save size={14} />

              {saving
                ? 'Enregistrement...'
                : editingId
                  ? 'Mettre à jour'
                  : 'Créer le produit'}

            </button>

          </form>

        )}

        {/* ================================
            LISTE DES PRODUITS
        ================================= */}

        {loading ? (

          <p className="text-center text-neutral-400 font-mono text-xs">
            Chargement des produits...
          </p>

        ) : error ? (

          <p className="text-center text-red-400 font-mono text-xs">
            {error}
          </p>

        ) : products.length === 0 ? (

          <p className="text-center text-neutral-400 font-mono text-xs">
            Aucun produit.
          </p>

        ) : (

          <div className="bg-[#FCFAFA] text-neutral-900 border border-[#9E6B6B]/30 p-6 shadow-2xl">

            <h2 className="text-xl font-serif mb-4 flex items-center gap-2">

              <Package
                size={20}
                className="text-[#9E6B6B]"
              />

              {products.length} produit(s)

            </h2>

            <div className="overflow-x-auto">

              <table className="w-full text-left border-collapse">

                <thead>

                  <tr className="border-b border-[#9E6B6B]/20 text-[10px] font-mono uppercase text-neutral-600 tracking-wider">

                    <th className="py-3 px-3">
                      Image
                    </th>

                    <th className="py-3 px-3">
                      Nom
                    </th>

                    <th className="py-3 px-3">
                      Collection
                    </th>

                    <th className="py-3 px-3">
                      Prix
                    </th>

                    <th className="py-3 px-3">
                      Stock
                    </th>

                    <th className="py-3 px-3">
                      Statut
                    </th>

                    <th className="py-3 px-3 text-center">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-[#9E6B6B]/10 text-sm">

                  {products.map((p) => (

                    <tr
                      key={p.id}
                      className="hover:bg-neutral-100 transition-colors"
                    >

                      <td className="py-2 px-3">

                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 object-contain bg-[#EAE4E1] p-1"
                        />

                      </td>

                      <td className="py-2 px-3 font-medium">
                        {p.name}
                      </td>

                      <td className="py-2 px-3 font-mono text-xs">
                        {p.category}
                      </td>

                      <td className="py-2 px-3 font-mono text-xs">
                        {p.price} €
                      </td>

                      <td className="py-2 px-3 font-mono text-xs">
                        {p.stock}
                      </td>

                      <td className="py-2 px-3">

                        {p.isActive === false ? (

                          <span className="text-amber-700 text-xs font-mono">
                            Masqué
                          </span>

                        ) : (

                          <span className="text-green-700 text-xs font-mono">
                            Visible
                          </span>

                        )}

                      </td>

                      <td className="py-2 px-3">

                        <div className="flex justify-center gap-2">

                          <button
                            onClick={() =>
                              openEdit(p)
                            }
                            title="Modifier"
                            className="p-2 bg-neutral-200 hover:bg-neutral-300 cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(p.id)
                            }
                            title="Supprimer"
                            className="p-2 bg-rose-100 text-rose-700 hover:bg-rose-200 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}

