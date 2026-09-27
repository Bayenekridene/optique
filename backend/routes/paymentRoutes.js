const express = require("express");
const Stripe = require("stripe");

const pool = require("../config/db");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ======================================================
// Stripe accepte seulement des images avec une URL https
// ======================================================

const stripeImages = (url) =>
  /^https:\/\//i.test(url || "") ? [url] : [];

// ======================================================
// POST /api/payment/create-checkout-session
// ======================================================

router.post("/create-checkout-session", protect, async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Le panier est vide.",
      });
    }

    if (items.length > 50) {
      return res.status(400).json({
        error: "Le panier contient trop de produits.",
      });
    }

    // ==================================================
    // NORMALISER LES PRODUITS
    // ==================================================

    const normalizedItems = new Map();

    for (const item of items) {
      const productId =
        item?.productId ||
        item?.id ||
        item?._id;

      const quantity = Number(
        item?.quantity ??
        item?.quantite ??
        1
      );

      if (
        !productId ||
        typeof productId !== "string"
      ) {
        return res.status(400).json({
          error: "Identifiant produit invalide.",
        });
      }

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 100
      ) {
        return res.status(400).json({
          error: "Quantité de produit invalide.",
        });
      }

      const totalQuantity =
        (normalizedItems.get(productId) || 0) +
        quantity;

      if (totalQuantity > 100) {
        return res.status(400).json({
          error:
            "Quantité maximale dépassée pour un produit.",
        });
      }

      normalizedItems.set(productId, totalQuantity);
    }

    const productIds = [
      ...normalizedItems.keys(),
    ];

    // ==================================================
    // RÉCUPÉRER LES PRODUITS DEPUIS MYSQL
    // ==================================================

    const placeholders =
      productIds.map(() => "?").join(",");

    const [products] = await pool.execute(
      `
      SELECT
        id,
        name,
        price,
        image,
        stock,
        isActive
      FROM products
      WHERE id IN (${placeholders})
        AND isActive = 1
      `,
      productIds
    );

    if (products.length !== productIds.length) {
      return res.status(400).json({
        error:
          "Un ou plusieurs produits sont introuvables ou indisponibles.",
      });
    }

    const productsById = new Map(
      products.map((product) => [
        product.id,
        product,
      ])
    );

    // ==================================================
    // VÉRIFICATION STOCK + PRIX
    // ==================================================

    const validatedItems = [];

    for (const productId of productIds) {
      const product =
        productsById.get(productId);

      const quantity =
        normalizedItems.get(productId);

      const price = Number(product.price);
      const stock = Number(product.stock);

      if (
        !Number.isInteger(stock) ||
        stock < quantity
      ) {
        return res.status(400).json({
          error:
            `Stock insuffisant pour ${product.name}. Disponible : ${stock}.`,
        });
      }

      if (
        !Number.isFinite(price) ||
        price <= 0
      ) {
        return res.status(400).json({
          error:
            `Prix invalide pour ${product.name}.`,
        });
      }

      validatedItems.push({
        product,
        quantity,
        price,
      });
    }

    // ==================================================
    // CALCUL DU TOTAL
    // ==================================================

   const [deliveryRows] = await pool.execute(
  `
  SELECT type, amount
  FROM delivery_settings
  WHERE id = 1
  LIMIT 1
  `
);

if (deliveryRows.length === 0) {
  return res.status(500).json({
    message: "Paramètres de livraison introuvables.",
  });
}

const deliverySettings = deliveryRows[0];

const shipping =
  deliverySettings.type === "free"
    ? 0
    : Number(deliverySettings.amount);

    // ==================================================
    // LIGNES STRIPE
    // ==================================================

    const lineItems =
      validatedItems.map(
        ({ product, quantity, price }) => ({
          price_data: {
            currency: "eur",

            product_data: {
              name: product.name,

              images: stripeImages(
                product.image
              ),

              metadata: {
                productId: product.id,
              },
            },

            unit_amount:
              Math.round(price * 100),
          },

          quantity,
        })
      );

    // ==================================================
    // SESSION STRIPE
    // ==================================================

    const sessionConfig = {
      mode: "payment",

      payment_method_types: ["card"],

      line_items: lineItems,

      success_url:
        `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${process.env.FRONTEND_URL}/cart`,

      customer_email: req.user.email,

      billing_address_collection:
        "required",

      metadata: {
        userId: req.user.id,
      },
    };

    // ==================================================
    // LIVRAISON
    // ==================================================

    if (shipping > 0) {
      sessionConfig.shipping_options = [
        {
          shipping_rate_data: {
            type: "fixed_amount",

            fixed_amount: {
              amount:
                Math.round(
                  shipping * 100
                ),
              currency: "eur",
            },

            display_name: "Livraison",

            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 1,
              },

              maximum: {
                unit: "business_day",
                value: 3,
              },
            },
          },
        },
      ];
    }

    // ==================================================
    // CRÉER SESSION STRIPE
    // ==================================================

const session =
  await stripe.checkout.sessions.create(
    sessionConfig
  );

return res.json({
      url: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error(
      "Erreur création session Stripe :",
      error.message
    );

    return res.status(500).json({
      error:
        "Erreur lors de la création du paiement.",
    });
  }
});

module.exports = router;