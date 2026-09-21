
import React, { useState, useEffect } from 'react';

import { useSelector, useDispatch } from 'react-redux';

import { Link } from 'react-router-dom';

import {
  removeFromCart,
  clearCart,
  updateQuantity,
  updateBackendCart,
} from '../features/cartSlice';

import {
  getCart,
  saveCart,
} from '../services/api';

import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

import bgBayene from '../assets/bg-bayene.jpg';

export default function Cart() {
  const dispatch = useDispatch();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(true);

  const API_URL =
    process.env.REACT_APP_API_URL ||
    'http://localhost:5000/api';

  const { items, totalItems } = useSelector(
    (state) => state.cart
  );

  const userInfo = useSelector(
    (state) => state.user.userInfo
  );

  // ======================================================
  // VÉRIFIER LA CONNEXION
  // ======================================================

  const isAdmin =
    userInfo?.role === 'admin' ||
    userInfo?.isAdmin === true;

  const isApproved =
    userInfo?.isApproved === true ||
    isAdmin;

  // ======================================================
  // RÉCUPÉRER LE PANIER BACKEND
  // ======================================================

  useEffect(() => {
    const loadCart = async () => {
      if (!userInfo || !isApproved) {
        setIsLoadingCart(false);
        return;
      }

      try {
        const response = await getCart();

        const backendItems =
          response.data?.items || [];

        dispatch(
          updateBackendCart(backendItems)
        );
      } catch (error) {
        console.error(
          '❌ Erreur récupération panier :',
          error
        );
      } finally {
        setIsLoadingCart(false);
      }
    };

    loadCart();
  }, [dispatch, userInfo, isApproved]);

  // ======================================================
  // SAUVEGARDER LE PANIER BACKEND
  // ======================================================

  const syncCartWithBackend = async (cartItems) => {
    if (!userInfo || !isApproved) {
      return;
    }

    try {
      const backendItems = cartItems.map(
        (item) => ({
          productId:
            item._id || item.id,

          quantite:
            Number(item.quantite || 1),
        })
      );

      const response =
        await saveCart(backendItems);

      const savedItems =
        response.data?.items || [];

      dispatch(
        updateBackendCart(savedItems)
      );
    } catch (error) {
      console.error(
        '❌ Erreur synchronisation panier :',
        error
      );
    }
  };

  // ======================================================
  // PRIX
  // ======================================================

  const getPrice = (item) => {
    const price =
      item.price !== undefined &&
      item.price !== null
        ? item.price
        : item.prix;

    if (typeof price === 'number') {
      return price;
    }

    if (typeof price === 'string') {
      const cleanedPrice = price
        .replace(/[^\d,.-]/g, '')
        .replace(',', '.');

      return parseFloat(cleanedPrice) || 0;
    }

    return 0;
  };

  // ======================================================
  // TOTAL
  // ======================================================

  const total = items.reduce(
    (acc, item) => {
      const price = getPrice(item);

      const quantity =
        Number(item.quantite || 1);

      return acc + price * quantity;
    },
    0
  );

  const shipping =
    total >= 150 || total === 0
      ? 0
      : 10;

  const finalTotal =
    total + shipping;

  // ======================================================
  // ANIMATION
  // ======================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // ======================================================
  // MODIFIER QUANTITÉ
  // ======================================================

  const handleUpdateQuantity = async (
    id,
    quantite
  ) => {
    dispatch(
      updateQuantity({
        id,
        quantite,
      })
    );

    const updatedItems = items
      .map((item) => {
        const itemId =
          item._id || item.id;

        if (
          itemId?.toString() ===
          id?.toString()
        ) {
          return {
            ...item,
            quantite,
          };
        }

        return item;
      })
      .filter(
        (item) =>
          Number(item.quantite || 1) > 0
      );

    await syncCartWithBackend(
      updatedItems
    );
  };

  // ======================================================
  // SUPPRIMER
  // ======================================================

  const handleRemove = async (id) => {
    const updatedItems =
      items.filter(
        (item) =>
          (item._id || item.id)?.toString() !==
          id?.toString()
      );

    dispatch(
      removeFromCart(id)
    );

    await syncCartWithBackend(
      updatedItems
    );
  };

  // ======================================================
  // VIDER PANIER
  // ======================================================

  const handleClearCart = async () => {
    dispatch(clearCart());

    await syncCartWithBackend([]);
  };

  // ======================================================
  // PAIEMENT STRIPE
  // ======================================================

  const handleCheckout = async () => {
    if (items.length === 0) {
      return;
    }

    if (!userInfo || !isApproved) {
      alert(
        'Vous devez être connecté et approuvé pour effectuer un paiement.'
      );
      return;
    }

    setIsProcessing(true);

    try {
      const checkoutItems =
        items.map((item) => ({
          productId:
            item._id || item.id,

          quantity:
            Number(item.quantite || 1),
        }));

      const invalidItem =
        checkoutItems.some(
          (item) =>
            !item.productId ||
            !Number.isInteger(
              item.quantity
            ) ||
            item.quantity <= 0
        );

      if (invalidItem) {
        throw new Error(
          'Un article du panier possède des informations invalides.'
        );
      }

      const token =
        localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'Votre session a expiré. Veuillez vous reconnecter.'
        );
      }

      const response = await fetch(
        `${API_URL}/payment/create-checkout-session`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            items: checkoutItems,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          'Erreur lors de la création du paiement.'
        );
      }

      if (!data?.url) {
        throw new Error(
          'Stripe n’a pas retourné de lien de paiement.'
        );
      }

      console.log(
        '✅ Redirection vers Stripe...'
      );

      window.location.href =
        data.url;

    } catch (error) {
      console.error(
        '❌ Erreur paiement :',
        error
      );

      alert(
        error.message ||
        'Une erreur est survenue lors du paiement.'
      );

      setIsProcessing(false);
    }
  };

  // ======================================================
  // CHARGEMENT
  // ======================================================

  if (isLoadingCart) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2
          size={28}
          className="animate-spin"
        />
      </div>
    );
  }

  // ======================================================
  // AFFICHAGE
  // ======================================================

  return (
    <div className="relative min-h-screen bg-black text-white pt-24 sm:pt-32 pb-24 px-4 sm:px-10 lg:px-16 overflow-hidden">

      {/* BACKGROUND */}

      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center z-0 pointer-events-none"
        style={{
          backgroundImage:
            `url(${bgBayene})`,
          opacity: 0.5,
        }}
      />

      <div className="absolute inset-0 bg-black/5 z-0 pointer-events-none" />

      {/* CONTENU */}

      <div
        className={`relative z-10 max-w-7xl w-full mx-auto space-y-8 sm:space-y-12 transition-all duration-1000 ease-out transform ${
          isLoaded
            ? 'translate-x-0 opacity-100'
            : '-translate-x-full opacity-0'
        }`}
      >

        {/* TITRE */}

        <div className="text-center space-y-3">

          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#9E6B6B]">
            Bayene Eyewear & La Roselle Atelier
          </span>

          <h1 className="text-3xl sm:text-5xl font-serif text-white font-light tracking-wide">
            Votre Panier
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 font-light">
            {totalItems} article(s)
          </p>

          <div className="w-16 h-[1px] bg-[#9E6B6B] mx-auto pt-2" />
        </div>

        {/* PANIER VIDE */}

        {items.length === 0 ? (

          <div
            style={{ borderRadius: '0px' }}
            className="max-w-xl mx-auto bg-[#F7F3F2]/90 backdrop-blur-md border border-[#9E6B6B]/40 p-8 sm:p-14 shadow-2xl relative rounded-none text-center space-y-6 text-[#3A3230]"
          >

            <div
              style={{ borderRadius: '0px' }}
              className="w-16 h-16 bg-[#EAE4E1] border border-[#9E6B6B]/40 mx-auto flex items-center justify-center text-[#9E6B6B] rounded-none"
            >
              <ShoppingBag size={24} />
            </div>

            <div className="space-y-2">

              <h2 className="text-xl sm:text-2xl font-serif font-light">
                Votre panier est vide
              </h2>

              <p className="text-xs sm:text-sm text-neutral-600 font-light leading-relaxed">
                Découvrez nos collections raffinées et trouvez la monture idéale.
              </p>

            </div>

            <div className="pt-4">

              <Link
                to="/collection"
                style={{ borderRadius: '0px' }}
                className="inline-flex items-center justify-center gap-3 w-full py-4 px-8 text-xs font-medium uppercase tracking-widest text-white bg-[#9E6B6B] hover:bg-[#8A5A5A] border border-[#9E6B6B]/60 transition-all duration-300 shadow-lg rounded-none"
              >
                Explorer la collection
                <ArrowRight size={15} />
              </Link>

            </div>

          </div>

        ) : (

          /* PANIER AVEC ARTICLES */

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ARTICLES */}

            <div className="lg:col-span-8 space-y-4">

              <div className="flex justify-between items-center px-2">

                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
                  Articles sélectionnés
                </span>

                <button
                  onClick={handleClearCart}
                  className="text-xs text-[#d4a3a3] hover:text-white transition-colors underline cursor-pointer"
                >
                  Vider le panier
                </button>

              </div>

              {items.map((item) => {

                const itemPrice =
                  getPrice(item);

                const displayName =
                  item.nom ||
                  item.name ||
                  'Article';

                const quantity =
                  Number(
                    item.quantite || 1
                  );

                const itemId =
                  item._id || item.id;

                return (

                  <div
                    key={itemId}
                    style={{ borderRadius: '0px' }}
                    className="bg-[#F7F3F2]/95 backdrop-blur-md p-4 sm:p-6 border border-[#9E6B6B]/40 shadow-xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 transition-all hover:border-[#9E6B6B]/80 rounded-none text-[#3A3230]"
                  >

                    {/* IMAGE */}

                    <div
                      style={{ borderRadius: '0px' }}
                      className="w-24 h-24 sm:w-28 sm:h-28 bg-[#EAE4E1] border border-[#9E6B6B]/30 overflow-hidden flex items-center justify-center p-2 flex-shrink-0 rounded-none"
                    >

                      <img
                        src={item.image}
                        alt={displayName}
                        className="w-full h-full object-contain"
                      />

                    </div>

                    {/* INFORMATIONS */}

                    <div className="flex-1 text-center sm:text-left space-y-1">

                      <h3 className="text-sm font-medium tracking-tight font-serif text-[#3A3230]">
                        {displayName}
                      </h3>

                      <p className="text-xs text-neutral-500 font-light">
                        {item.categorie ||
                          'Édition Atelier'}
                      </p>

                      <p className="text-sm font-semibold text-[#9E6B6B] pt-1 font-mono">
                        {itemPrice} €
                      </p>

                    </div>

                    {/* QUANTITÉ */}

                    <div
                      style={{ borderRadius: '0px' }}
                      className="flex items-center gap-3 bg-[#EAE4E1] border border-[#9E6B6B]/30 px-3 py-1.5 rounded-none"
                    >

                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            itemId,
                            quantity - 1
                          )
                        }
                        disabled={
                          quantity <= 1
                        }
                        className="text-neutral-700 hover:text-black transition-colors p-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus size={12} />
                      </button>

                      <span className="text-xs font-mono font-medium text-[#3A3230] w-4 text-center">
                        {quantity}
                      </span>

                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            itemId,
                            quantity + 1
                          )
                        }
                        disabled={
                          quantity >= 100
                        }
                        className="text-neutral-700 hover:text-black transition-colors p-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus size={12} />
                      </button>

                    </div>

                    {/* SUPPRIMER */}

                    <button
                      onClick={() =>
                        handleRemove(itemId)
                      }
                      style={{
                        borderRadius: '0px',
                      }}
                      className="text-neutral-500 hover:text-rose-700 p-2 hover:bg-rose-100 transition-all sm:ml-2 cursor-pointer rounded-none"
                      title="Supprimer l'article"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>
                );
              })}

              {/* CONTINUER */}

              <div className="pt-4">

                <Link
                  to="/collection"
                  className="inline-flex items-center gap-2 text-xs text-neutral-300 hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} />

                  <span>
                    Continuer vos achats
                  </span>
                </Link>

              </div>

            </div>

            {/* RÉSUMÉ */}

            <div className="lg:col-span-4 lg:sticky lg:top-36">

              <div
                style={{
                  borderRadius: '0px',
                }}
                className="bg-[#F7F3F2]/95 backdrop-blur-md p-6 sm:p-8 border border-[#9E6B6B]/40 shadow-2xl space-y-6 relative rounded-none text-[#3A3230]"
              >

                <h2 className="text-xs uppercase tracking-[0.2em] font-medium text-[#3A3230] border-b border-[#9E6B6B]/30 pb-4">
                  Résumé de la Commande
                </h2>

                <div className="space-y-3 text-xs">

                  {/* SOUS-TOTAL */}

                  <div className="flex justify-between text-neutral-700">

                    <span>
                      Sous-total
                    </span>

                    <span className="font-mono text-[#3A3230]">
                      {total.toFixed(2)} €
                    </span>

                  </div>

                  {/* LIVRAISON */}

                  <div className="flex justify-between text-neutral-700">

                    <span>
                      Livraison estimée
                    </span>

                    <span className="font-mono">

                      {shipping === 0 ? (

                        <strong className="text-[#9E6B6B] font-normal">
                          Offerte
                        </strong>

                      ) : (

                        <span className="text-[#3A3230]">
                          {shipping.toFixed(2)} €
                        </span>

                      )}

                    </span>

                  </div>

                  {shipping > 0 && (

                    <p className="text-[10px] text-neutral-500 italic">
                      Livraison offerte dès 150 € d'achat.
                    </p>

                  )}

                </div>

                {/* TOTAL */}

                <div className="border-t border-[#9E6B6B]/30 pt-4 flex justify-between items-baseline">

                  <span className="text-sm font-medium text-[#3A3230] uppercase tracking-wider">
                    Total
                  </span>

                  <span className="text-xl font-semibold text-[#9E6B6B] font-mono">
                    {finalTotal.toFixed(2)} €
                  </span>

                </div>

                {/* PAIEMENT */}

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  style={{
                    borderRadius: '0px',
                  }}
                  className="w-full bg-[#9E6B6B] hover:bg-[#8A5A5A] text-white py-4 px-6 text-xs tracking-[0.15em] uppercase transition-all shadow-lg border border-[#9E6B6B]/60 active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                >

                  {isProcessing ? (

                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />

                      <span>
                        Redirection...
                      </span>
                    </>

                  ) : (

                    <>
                      <span>
                        Commander
                      </span>

                      <ArrowRight size={14} />
                    </>

                  )}

                </button>

                {/* INFORMATIONS */}

                <div className="space-y-2 pt-2 border-t border-[#9E6B6B]/30 text-[10px] text-neutral-500 text-center uppercase tracking-widest font-mono">

                  <p>
                    Paiement 100% sécurisé via Stripe
                  </p>

                  <p>
                    Expédition sous 24h à 48h
                  </p>

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}
