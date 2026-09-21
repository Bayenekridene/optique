import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

import { useDispatch } from "react-redux";
import { clearCart } from "../features/cartSlice";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000/api";

const Success = () => {
  const dispatch = useDispatch();

  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const getOrder = async () => {
      try {
        if (!sessionId) {
          setError("Aucune commande trouvée.");
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
          setError("Vous devez être connecté.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_URL}/orders/by-session/${sessionId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Commande introuvable.");
        }

        const data = await response.json();

        setOrder(data);

        dispatch(clearCart());
      } catch (err) {
        console.error("❌ Erreur commande :", err);

        setError(
          "Impossible de récupérer votre commande."
        );
      } finally {
        setLoading(false);
      }
    };

    getOrder();
  }, [sessionId, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F2] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D4B8AE] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-[#3D3229] text-lg">
            Préparation de votre commande...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF6F2] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-serif text-[#3D3229] mb-4">
            Une erreur est survenue
          </h1>

          <p className="text-[#8B7355] mb-8">
            {error}
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#3D3229] text-white px-6 py-3 rounded-full hover:bg-[#8B7355] transition"
          >
            Retour à l'accueil
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F2] py-16 px-6">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-12">
          <CheckCircle
            size={72}
            strokeWidth={1.5}
            className="mx-auto text-[#8B7355] mb-6"
          />

          <p className="uppercase tracking-[0.3em] text-sm text-[#8B7355] mb-3">
            La Roselle Atelier
          </p>

          <h1 className="text-4xl md:text-5xl font-serif text-[#3D3229] mb-5">
            Merci pour votre commande
          </h1>

          <p className="text-[#8B7355] max-w-xl mx-auto">
            Votre paiement a été confirmé avec succès.
            Votre commande est maintenant enregistrée.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 md:p-10">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E8DDD3] pb-6 mb-8">

            <div>
              <p className="text-xs uppercase tracking-widest text-[#8B7355] mb-2">
                Numéro de commande
              </p>

              <p className="text-lg font-medium text-[#3D3229] break-all">
                {order?._id}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[#8B7355]">
              <ShoppingBag size={20} />
              <span>
                Commande confirmée
              </span>
            </div>
          </div>

          <div className="space-y-5">

            {order?.items?.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 pb-5 border-b border-[#E8DDD3]"
              >

                <div className="w-20 h-20 bg-[#FAF6F2] rounded-2xl flex items-center justify-center overflow-hidden">

                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ShoppingBag
                      size={28}
                      className="text-[#D4B8AE]"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-[#3D3229] font-medium">
                    {item.name}
                  </h3>

                  <p className="text-sm text-[#8B7355] mt-1">
                    Quantité : {item.quantity}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-medium text-[#3D3229]">
                    {(
                      item.price *
                      item.quantity
                    ).toFixed(2)}{" "}
                    €
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-3">

            <div className="flex justify-between text-[#8B7355]">
              <span>Sous-total</span>

              <span>
                {Number(
                  order?.subtotal || 0
                ).toFixed(2)}{" "}
                €
              </span>
            </div>

            <div className="flex justify-between text-[#8B7355]">
              <span>Livraison</span>

              <span>
                {Number(
                  order?.shipping || 0
                ).toFixed(2)}{" "}
                €
              </span>
            </div>

            <div className="flex justify-between text-xl font-medium text-[#3D3229] border-t border-[#E8DDD3] pt-5 mt-5">

              <span>Total</span>

              <span>
                {Number(
                  order?.total || 0
                ).toFixed(2)}{" "}
                €
              </span>

            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">

          <Link
            to="/"
            className="inline-flex justify-center items-center gap-2 px-7 py-3 rounded-full bg-[#3D3229] text-white hover:bg-[#8B7355] transition"
          >
            Continuer mes achats
            <ArrowRight size={18} />
          </Link>

          <Link
            to="/collections"
            className="inline-flex justify-center items-center gap-2 px-7 py-3 rounded-full border border-[#D4B8AE] text-[#3D3229] hover:bg-[#E8DDD3] transition"
          >
            Voir les collections
          </Link>

        </div>
      </div>
    </div>
  );
};

export default Success;