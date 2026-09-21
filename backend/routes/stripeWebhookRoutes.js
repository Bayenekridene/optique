const express = require('express');
const router = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');

const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

// ======================================================
// WEBHOOK STRIPE
// IMPORTANT : express.raw() AVANT express.json()
// ======================================================

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature =
      req.headers['stripe-signature'];

    if (!signature) {
      return res
        .status(400)
        .send('Signature Stripe manquante.');
    }

    let event;

    // ==================================================
    // 1. VÉRIFIER LA SIGNATURE STRIPE
    // ==================================================

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error(
        '❌ Signature Stripe invalide :',
        error.message
      );

      return res
        .status(400)
        .send('Webhook Stripe invalide.');
    }

    console.log(
      '✅ Événement Stripe reçu :',
      event.type
    );

    // ==================================================
    // 2. TRAITER UNIQUEMENT checkout.session.completed
    // ==================================================

    if (
      event.type !==
      'checkout.session.completed'
    ) {
      return res.json({
        received: true
      });
    }

    const session = event.data.object;

    try {
      console.log(
        '💳 Paiement confirmé :',
        session.id
      );

      // ==================================================
      // 3. VÉRIFIER LE PAIEMENT
      // ==================================================

      if (
        session.payment_status !== 'paid'
      ) {
        console.log(
          'ℹ️ Paiement non confirmé :',
          session.payment_status
        );

        return res.json({
          received: true
        });
      }

      // ==================================================
      // 4. VÉRIFIER L'UTILISATEUR
      // ==================================================

      const userId =
        session.metadata?.userId;

      if (
        !userId ||
        !mongoose.isValidObjectId(userId)
      ) {
        throw new Error(
          'Identifiant utilisateur invalide ou absent.'
        );
      }

      // ==================================================
      // 5. EMAIL CLIENT
      // ==================================================

      const customerEmail =
        session.customer_details?.email
          ?.trim()
          .toLowerCase() || '';

      if (!customerEmail) {
        throw new Error(
          'Email client absent de la session Stripe.'
        );
      }

      // ==================================================
      // 6. EMPÊCHER LES DOUBLONS
      // ==================================================

      const existingOrder =
        await Order.findOne({
          stripeSessionId: session.id
        });

      if (existingOrder) {
        console.log(
          'ℹ️ Commande déjà enregistrée :',
          existingOrder._id.toString()
        );

        // Même si Stripe renvoie le webhook,
        // on répond correctement.
        return res.json({
          received: true
        });
      }

      // ==================================================
      // 7. RÉCUPÉRER LES ARTICLES STRIPE
      // ==================================================

      const lineItems =
        await stripe.checkout.sessions.listLineItems(
          session.id,
          {
            expand: [
              'data.price.product'
            ]
          }
        );

      if (
        !lineItems.data ||
        lineItems.data.length === 0
      ) {
        throw new Error(
          'Aucun produit trouvé dans la session Stripe.'
        );
      }

      // ==================================================
      // 8. CONSTRUIRE LA COMMANDE
      //    DEPUIS MONGODB
      // ==================================================

      const orderItems = [];

      for (
        const item of lineItems.data
      ) {
        const stripeProduct =
          item.price?.product;

        const productId =
          stripeProduct?.metadata?.productId;

        if (
          !productId ||
          !mongoose.isValidObjectId(
            productId
          )
        ) {
          throw new Error(
            'Identifiant MongoDB absent ou invalide.'
          );
        }

        const product =
          await Product.findById(
            productId
          );

        if (!product) {
          throw new Error(
            `Produit MongoDB introuvable : ${productId}`
          );
        }

        const quantity =
          Number(item.quantity || 1);

        if (
          !Number.isInteger(quantity) ||
          quantity <= 0 ||
          quantity > 100
        ) {
          throw new Error(
            `Quantité invalide pour ${productId}.`
          );
        }

        // 🔒 PRIX DEPUIS MONGODB UNIQUEMENT
        const price =
          Number(
            product.price ??
            product.prix
          );

        if (
          !Number.isFinite(price) ||
          price <= 0
        ) {
          throw new Error(
            `Prix invalide pour ${productId}.`
          );
        }

        orderItems.push({
          productId: product._id,

          name:
            product.name ||
            product.nom ||
            'Article',

          price,

          quantity,

          image:
            product.image || ''
        });
      }

      // ==================================================
      // 9. CALCULER LE SOUS-TOTAL
      // ==================================================

      const subtotal =
        orderItems.reduce(
          (total, item) =>
            total +
            item.price *
              item.quantity,
          0
        );

      if (
        !Number.isFinite(subtotal) ||
        subtotal <= 0
      ) {
        throw new Error(
          'Sous-total invalide.'
        );
      }

      // ==================================================
      // 10. CALCULER LA LIVRAISON
      // ==================================================

      const shipping =
        subtotal >= 150
          ? 0
          : 10;

      const expectedTotal =
        subtotal + shipping;

      // ==================================================
      // 11. VÉRIFIER LE MONTANT STRIPE
      // ==================================================

      const stripeTotal =
        Number(
          session.amount_total || 0
        ) / 100;

      if (
        !Number.isFinite(
          stripeTotal
        ) ||
        stripeTotal <= 0
      ) {
        throw new Error(
          'Montant Stripe invalide.'
        );
      }

      if (
        Math.abs(
          stripeTotal -
            expectedTotal
        ) > 0.01
      ) {
        console.error(
          '❌ Montant Stripe différent :',
          {
            stripeTotal,
            expectedTotal
          }
        );

        throw new Error(
          'Le montant du paiement ne correspond pas aux produits.'
        );
      }

      // ==================================================
      // 12. TRANSACTION MONGODB
      // STOCK + COMMANDE
      // ==================================================

      const mongoSession =
        await mongoose.startSession();

      try {
        await mongoSession.withTransaction(
          async () => {

            // ==========================================
            // 12A. VÉRIFIER LE STOCK
            // ==========================================

            for (
              const item of orderItems
            ) {
              const product =
                await Product.findById(
                  item.productId
                ).session(
                  mongoSession
                );

              if (!product) {
                throw new Error(
                  `Produit introuvable : ${item.productId}`
                );
              }

              const stock =
                Number(product.stock);

              if (
                !Number.isInteger(stock) ||
                stock < item.quantity
              ) {
                throw new Error(
                  `Stock insuffisant pour ${
                    product.name ||
                    product.nom ||
                    'ce produit'
                  }.`
                );
              }
            }

            // ==========================================
            // 12B. DIMINUER LE STOCK
            // ==========================================

            for (
              const item of orderItems
            ) {
              const updatedProduct =
                await Product.findOneAndUpdate(
                  {
                    _id:
                      item.productId,

                    stock: {
                      $gte:
                        item.quantity
                    }
                  },
                  {
                    $inc: {
                      stock:
                        -item.quantity
                    }
                  },
                  {
                    new: true,
                    session:
                      mongoSession
                  }
                );

              if (!updatedProduct) {
                throw new Error(
                  `Impossible de mettre à jour le stock pour ${item.productId}.`
                );
              }

              console.log(
                `📦 Stock mis à jour : ${
                  updatedProduct.name ||
                  updatedProduct.nom
                } → ${
                  updatedProduct.stock
                }`
              );
            }

            // ==========================================
            // 12C. CRÉER LA COMMANDE
            // ==========================================

            await Order.create(
              [
                {
                  userId:
                    new mongoose.Types.ObjectId(
                      userId
                    ),

                  customerEmail,

                  items:
                    orderItems,

                  subtotal,

                  shipping,

                  total:
                    stripeTotal,

                  stripeSessionId:
                    session.id,

                  paymentStatus:
                    'paid'
                }
              ],
              {
                session:
                  mongoSession
              }
            );

            // ==========================================
            // 12D. VIDER LE PANIER
            // ==========================================

            await Cart.deleteOne(
              {
                userId:
                  new mongoose.Types.ObjectId(
                    userId
                  )
              },
              {
                session:
                  mongoSession
              }
            );

            console.log(
              '🛒 Panier supprimé après paiement.'
            );
          }
        );

      } finally {
        await mongoSession.endSession();
      }

      // ==================================================
      // 13. SUCCÈS
      // ==================================================

      console.log(
        '✅ Commande enregistrée avec succès.'
      );

      console.log(
        '✅ Paiement + commande + stock + panier terminés.'
      );

      return res.json({
        received: true
      });

    } catch (error) {
      // ==================================================
      // ERREUR
      // ==================================================

      console.error(
        '❌ Erreur webhook Stripe :',
        error.message
      );

      return res.status(500).json({
        error:
          'Erreur lors du traitement du webhook.'
      });
    }
  }
);

module.exports = router;