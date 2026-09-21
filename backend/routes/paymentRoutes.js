const express = require('express');
const router = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');

const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

// ======================================================
// CRÉER UNE SESSION STRIPE
// 🔒 UTILISATEUR CONNECTÉ ET APPROUVÉ UNIQUEMENT
// ======================================================

router.post(
  '/create-checkout-session',
  protect,
  async (req, res) => {
    try {
      // ==================================================
      // 1. VÉRIFIER L'UTILISATEUR
      // ==================================================

   const isAdmin =
  req.user.role === 'admin' ||
  req.user.isAdmin === true;

const isApproved =
  req.user.isApproved === true ||
  isAdmin;

if (!isApproved) {
  return res.status(403).json({
    error:
      "Votre compte doit être approuvé avant de pouvoir effectuer un paiement."
  });
}

      // ==================================================
      // 2. VÉRIFIER LE PANIER
      // ==================================================

      const { items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'Le panier est vide.'
        });
      }

      // Limite de sécurité
      if (items.length > 50) {
        return res.status(400).json({
          error: 'Le panier contient trop de produits.'
        });
      }

      // ==================================================
      // 3. NORMALISER LES PRODUITS
      // ==================================================

      const normalizedItems = new Map();

      for (const item of items) {
        if (!item || typeof item !== 'object') {
          return res.status(400).json({
            error: 'Article du panier invalide.'
          });
        }

        const productId = item.productId || item.id;

        if (
          !productId ||
          !mongoose.isValidObjectId(productId)
        ) {
          return res.status(400).json({
            error: 'Identifiant produit invalide.'
          });
        }

        const quantity = Number(
          item.quantity ?? item.quantite ?? 1
        );

        if (
          !Number.isInteger(quantity) ||
          quantity <= 0 ||
          quantity > 100
        ) {
          return res.status(400).json({
            error: 'Quantité de produit invalide.'
          });
        }

        const key = productId.toString();

        if (normalizedItems.has(key)) {
          const newQuantity =
            normalizedItems.get(key) + quantity;

          if (newQuantity > 100) {
            return res.status(400).json({
              error: 'Quantité maximale dépassée pour un produit.'
            });
          }

          normalizedItems.set(key, newQuantity);
        } else {
          normalizedItems.set(key, quantity);
        }
      }

      // ==================================================
      // 4. RÉCUPÉRER LES PRODUITS DEPUIS MONGODB
      // IMPORTANT :
      // LE PRIX DU FRONTEND EST IGNORÉ
      // ==================================================

      const productIds = Array.from(
        normalizedItems.keys()
      );

      const products = await Product.find({
        _id: { $in: productIds }
      });

      if (products.length !== productIds.length) {
        return res.status(400).json({
          error:
            'Un ou plusieurs produits du panier sont introuvables.'
        });
      }

      // ==================================================
      // 5. VÉRIFIER STOCK + PRIX
      // ==================================================

      const validatedItems = [];

      for (const productId of productIds) {
        const product = products.find(
          (p) => p._id.toString() === productId
        );

        if (!product) {
          return res.status(400).json({
            error: 'Produit introuvable.'
          });
        }

        const quantity =
          normalizedItems.get(productId);

        // -----------------------------------------------
        // STOCK
        // -----------------------------------------------

        const stock = Number(product.stock);

        if (
          !Number.isInteger(stock) ||
          stock < 0
        ) {
          return res.status(400).json({
            error:
              `Stock invalide pour ${product.name || product.nom || 'ce produit'}.`
          });
        }

        if (quantity > stock) {
          return res.status(400).json({
            error:
              `Stock insuffisant pour ${product.name || product.nom || 'ce produit'}. Disponible : ${stock}.`
          });
        }

        // -----------------------------------------------
        // PRIX
        // -----------------------------------------------

        const price = Number(
          product.price ?? product.prix
        );

        if (
          !Number.isFinite(price) ||
          price <= 0
        ) {
          return res.status(400).json({
            error:
              `Prix invalide pour ${product.name || product.nom || 'ce produit'}.`
          });
        }

        validatedItems.push({
          product,
          quantity,
          price
        });
      }

      // ==================================================
      // 6. CALCUL DU SOUS-TOTAL
      // ==================================================

      const subtotal = validatedItems.reduce(
        (total, item) =>
          total + item.price * item.quantity,
        0
      );

      if (
        !Number.isFinite(subtotal) ||
        subtotal <= 0
      ) {
        return res.status(400).json({
          error: 'Montant du panier invalide.'
        });
      }

      // ==================================================
      // 7. LIVRAISON
      // ==================================================

      const shipping =
        subtotal >= 150 ? 0 : 10;

      // ==================================================
      // 8. ARTICLES STRIPE
      // ==================================================

      const line_items = validatedItems.map(
        ({ product, quantity, price }) => ({
          price_data: {
            currency: 'eur',

            product_data: {
              name:
                product.name ||
                product.nom ||
                'Article',

              metadata: {
                productId:
                  product._id.toString()
              }
            },

            unit_amount:
              Math.round(price * 100)
          },

          quantity
        })
      );

      // ==================================================
      // 9. CONFIGURATION STRIPE
      // ==================================================

      const sessionConfig = {
        payment_method_types: ['card'],

        line_items,

        mode: 'payment',

        success_url:
          `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${process.env.FRONTEND_URL}/cart`,

        billing_address_collection: 'required',

        // 🔒 Email du compte connecté
        customer_email: req.user.email,

        metadata: {
          subtotal: subtotal.toFixed(2),
          shipping: shipping.toFixed(2),
          userId: req.user._id.toString()
        }
      };

      // ==================================================
      // 10. LIVRAISON STRIPE
      // ==================================================

      if (shipping > 0) {
        sessionConfig.shipping_options = [
          {
            shipping_rate_data: {
              type: 'fixed_amount',

              fixed_amount: {
                amount: 1000,
                currency: 'eur'
              },

              display_name: 'Livraison',

              delivery_estimate: {
                minimum: {
                  unit: 'business_day',
                  value: 1
                },

                maximum: {
                  unit: 'business_day',
                  value: 3
                }
              }
            }
          }
        ];
      }

      // ==================================================
      // 11. CRÉER LA SESSION STRIPE
      // ==================================================

      const session =
        await stripe.checkout.sessions.create(
          sessionConfig
        );

      console.log(
        '✅ Session Stripe créée :',
        session.id
      );

      // ==================================================
      // 12. RETOURNER L'URL STRIPE
      // ==================================================

      return res.json({
        url: session.url
      });

    } catch (error) {
      console.error(
        '❌ Erreur Stripe :',
        error
      );

      return res.status(500).json({
        error:
          'Erreur lors de la création du paiement.'
      });
    }
  }
);

module.exports = router;