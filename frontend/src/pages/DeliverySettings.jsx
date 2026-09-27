
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const DeliverySettings = () => {
  const [type, setType] = useState("fixed");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  // =========================
  // CHARGER LES PARAMÈTRES
  // =========================
  useEffect(() => {
    const loadDeliverySettings = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/delivery`
        );

        const delivery = response.data;

        setType(delivery.type || "fixed");
        setAmount(
          delivery.amount !== undefined
            ? delivery.amount
            : ""
        );
      } catch (error) {
        console.error(
          "Erreur chargement livraison :",
          error.response?.data || error.message
        );

        alert(
          "Impossible de charger les paramètres de livraison."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDeliverySettings();
  }, []);

  // =========================
  // ENREGISTRER
  // =========================
  const handleSave = async (e) => {
    e.preventDefault();

    if (type === "fixed") {
      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount < 0
      ) {
        alert(
          "Veuillez entrer un montant de livraison valide."
        );
        return;
      }
    }

    try {
      setSaving(true);

      const response = await axios.put(
        `${API_URL}/delivery`,
        {
          type,
          amount:
            type === "free"
              ? 0
              : Number(amount),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const delivery = response.data.delivery;

      setType(delivery.type);
      setAmount(delivery.amount);

      alert("Livraison mise à jour avec succès ✅");
    } catch (error) {
      console.error(
        "Erreur sauvegarde livraison :",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Impossible de modifier la livraison."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F2] flex items-center justify-center">
        <p className="text-[#3D3229] text-lg">
          Chargement...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F2] p-40">
      <div className="max-w-2xl mx-auto">
<button
  onClick={() => window.history.back()}
  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono uppercase tracking-widest transition-colors"
>
  ← Retour
</button>
        {/* TITRE */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#3D3229]">
            Livraison
          </h1>

          <p className="mt-2 text-[#8B7355]">
            Gérez le tarif de livraison de votre boutique.
          </p>
        </div>

        {/* CARTE */}
        <div className="bg-white border border-[#E8DDD3] p-6 shadow-sm">

          <form onSubmit={handleSave}>

            {/* TYPE */}
            <div className="mb-6">
              <label className="block text-[#3D3229] font-medium mb-3">
                Type de livraison
              </label>

              <div className="space-y-3">

                {/* GRATUITE */}
                <label className="flex items-center gap-3 cursor-pointer border border-[#E8DDD3] p-4">
                  <input
                    type="radio"
                    name="deliveryType"
                    value="free"
                    checked={type === "free"}
                    onChange={() => {
                      setType("free");
                      setAmount(0);
                    }}
                    className="accent-[#9E6B6B]"
                  />

                  <div>
                    <p className="font-medium text-[#3D3229]">
                      Livraison gratuite
                    </p>

                    <p className="text-sm text-[#8B7355]">
                      Aucun frais de livraison ne sera ajouté.
                    </p>
                  </div>
                </label>

                {/* MONTANT FIXE */}
                <label className="flex items-center gap-3 cursor-pointer border border-[#E8DDD3] p-4">
                  <input
                    type="radio"
                    name="deliveryType"
                    value="fixed"
                    checked={type === "fixed"}
                    onChange={() => setType("fixed")}
                    className="accent-[#9E6B6B]"
                  />

                  <div>
                    <p className="font-medium text-[#3D3229]">
                      Montant fixe
                    </p>

                    <p className="text-sm text-[#8B7355]">
                      Définir un prix de livraison.
                    </p>
                  </div>
                </label>

              </div>
            </div>

            {/* MONTANT */}
            {type === "fixed" && (
              <div className="mb-6">
                <label
                  htmlFor="deliveryAmount"
                  className="block text-[#3D3229] font-medium mb-2"
                >
                  Montant de livraison (€)
                </label>

                <input
                  id="deliveryAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value)
                  }
                  placeholder="Exemple : 10"
                  className="w-full border border-[#D4B8AE] px-4 py-3 outline-none focus:border-[#9E6B6B]"
                />
              </div>
            )}

            {/* RÉSUMÉ */}
            <div className="bg-[#FAF6F2] border border-[#E8DDD3] p-4 mb-6">
              <p className="text-sm text-[#8B7355]">
                Configuration actuelle
              </p>

              <p className="text-lg font-medium text-[#3D3229] mt-1">
                {type === "free"
                  ? "Livraison gratuite"
                  : `${Number(amount || 0).toFixed(2)} €`}
              </p>
            </div>

            {/* BOUTON */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#9E6B6B] text-white py-3 px-6 hover:opacity-90 transition disabled:opacity-50"
            >
              {saving
                ? "Enregistrement..."
                : "Enregistrer la livraison"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default DeliverySettings;
