const express = require("express");
const Stripe = require("stripe");
const crypto = require("crypto");

const pool = require("../config/db");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/stripe/webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(400).send("Signature Stripe manquante.");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error("Signature Stripe invalide :", error.message);
      return res.status(400).send("Webhook Stripe invalide.");
    }

    // On traite uniquement les paiements terminés
    if (event.type !== "checkout.session.completed") {
      return res.json({ received: true });
    }

    const checkoutSession = event.data.object;

    try {
      // Paiement non payé
      if (checkoutSession.payment_status !== "paid") {
        return res.json({ received: true });
      }

      const userId = checkoutSession.metadata?.userId;

      if (!userId) {
        throw new Error("Identifiant utilisateur absent.");
      }

      const customerEmail =
        checkoutSession.customer_details?.email?.trim().toLowerCase();

      if (!customerEmail) {
        throw new Error("Email client absent de la session Stripe.");
      }

      // ===============================
      // ÉVITER LES DOUBLONS
      // ===============================

      const [existingOrders] = await pool.execute(
        `
        SELECT id
        FROM orders
        WHERE stripeSessionId = ?
        LIMIT 1
        `,
        [checkoutSession.id]
      );

      if (existingOrders.length > 0) {
        console.log("Commande déjà enregistrée :", checkoutSession.id);
        return res.json({ received: true });
      }

      // ===============================
      // RÉCUPÉRER LES ARTICLES STRIPE
      // ===============================

      const lineItems = await stripe.checkout.sessions.listLineItems(
        checkoutSession.id,
        {
          limit: 100,
          expand: ["data.price.product"],
        }
      );

      if (!lineItems.data?.length) {
        throw new Error("Aucun article trouvé dans la session Stripe.");
      }

      const orderItems = [];

      // ===============================
      // VÉRIFICATION DES PRODUITS
      // ===============================

      for (const lineItem of lineItems.data) {
        const productId =
          lineItem.price?.product?.metadata?.productId;

        if (!productId) {
          throw new Error("Identifiant produit absent de Stripe.");
        }

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
          WHERE id = ?
          LIMIT 1
          `,
          [String(productId)]
        );

        if (products.length === 0) {
          throw new Error(
            `Produit introuvable : ${productId}`
          );
        }

        const product = products[0];

        if (!product.isActive) {
          throw new Error(
            `Produit indisponible : ${product.name}`
          );
        }

        const quantity = Number(lineItem.quantity || 1);

        if (
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 100
        ) {
          throw new Error(
            `Quantité invalide pour ${product.name}.`
          );
        }

        const price = Number(product.price);

        if (!Number.isFinite(price) || price < 0) {
          throw new Error(
            `Prix invalide pour ${product.name}.`
          );
        }

        orderItems.push({
          productId: product.id,
          name: product.name,
          price,
          quantity,
          image: product.image || "",
        });
      }

      // ===============================
      // CALCUL DU TOTAL
      // ===============================

      const subtotal = orderItems.reduce(
        (sum, item) =>
          sum + item.price * item.quantity,
        0
      );

const [deliveryRows] = await pool.execute(
  `
  SELECT type, amount
  FROM delivery_settings
  WHERE id = 1
  LIMIT 1
  `
);

if (deliveryRows.length === 0) {
  throw new Error(
    "Paramètres de livraison introuvables."
  );
}

const deliverySettings = deliveryRows[0];

const shipping =
  deliverySettings.type === "free"
    ? 0
    : Number(deliverySettings.amount);
      const expectedTotal = subtotal + shipping;

      const stripeTotal =
        Number(checkoutSession.amount_total || 0) / 100;

      if (
        !Number.isFinite(stripeTotal) ||
        Math.abs(stripeTotal - expectedTotal) > 0.01
      ) {
        throw new Error(
          "Le montant Stripe ne correspond pas à la commande."
        );
      }

      // ===============================
      // TRANSACTION MYSQL
      // ===============================

      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        // Vérifier une nouvelle fois que la commande
        // n'a pas été créée entre-temps
        const [duplicateOrders] = await connection.execute(
          `
          SELECT id
          FROM orders
          WHERE stripeSessionId = ?
          LIMIT 1
          `,
          [checkoutSession.id]
        );

        if (duplicateOrders.length > 0) {
          await connection.rollback();
          connection.release();

          return res.json({ received: true });
        }

        // ===============================
        // VÉRIFIER + DIMINUER LE STOCK
        // ===============================

        for (const item of orderItems) {
          const [result] = await connection.execute(
            `
            UPDATE products
            SET stock = stock - ?
            WHERE id = ?
              AND isActive = 1
              AND stock >= ?
            `,
            [
              item.quantity,
              item.productId,
              item.quantity,
            ]
          );

          if (result.affectedRows !== 1) {
            throw new Error(
              `Stock insuffisant ou produit indisponible : ${item.name}.`
            );
          }
        }

        // ===============================
        // CRÉER LA COMMANDE
        // ===============================

        const orderId = crypto.randomUUID();

        await connection.execute(
          `
          INSERT INTO orders (
            id,
            userId,
            customerEmail,
            subtotal,
            shipping,
            total,
            stripeSessionId,
            paymentStatus
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            orderId,
            userId,
            customerEmail,
            subtotal,
            shipping,
            stripeTotal,
            checkoutSession.id,
            "paid",
          ]
        );

        // ===============================
        // CRÉER LES ARTICLES DE COMMANDE
        // ===============================

        for (const item of orderItems) {
          await connection.execute(
            `
            INSERT INTO order_items (
              id,
              orderId,
              productId,
              name,
              price,
              quantity,
              image
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
              crypto.randomUUID(),
              orderId,
              item.productId,
              item.name,
              item.price,
              item.quantity,
              item.image,
            ]
          );
        }

        // ===============================
        // VIDER LE PANIER
        // ===============================

        const [carts] = await connection.execute(
          `
          SELECT id
          FROM carts
          WHERE userId = ?
          LIMIT 1
          `,
          [userId]
        );

        if (carts.length > 0) {
          await connection.execute(
            `
            DELETE FROM cart_items
            WHERE cartId = ?
            `,
            [carts[0].id]
          );

          await connection.execute(
            `
            DELETE FROM carts
            WHERE id = ?
            `,
            [carts[0].id]
          );
        }

        await connection.commit();

        console.log(
          `Commande créée après paiement Stripe : ${checkoutSession.id}`
        );

        return res.json({ received: true });
      } catch (transactionError) {
        await connection.rollback();
        throw transactionError;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error(
        "Erreur webhook Stripe :",
        error.message
      );

      return res.status(500).json({
        message:
          "Erreur lors du traitement du paiement.",
      });
    }
  }
);

module.exports = router;