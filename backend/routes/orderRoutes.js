const express = require("express");

const pool = require("../config/db");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// ===============================
// MES COMMANDES — utilisateur connecté
// ===============================
router.get("/my-orders", protect, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `
      SELECT
        id,
        userId,
        customerEmail,
        subtotal,
        shipping,
        total,
        stripeSessionId,
        paymentStatus,
        createdAt,
        updatedAt
      FROM orders
      WHERE userId = ?
      ORDER BY createdAt DESC
      `,
      [req.user.id]
    );

    for (const order of orders) {
      const [items] = await pool.execute(
        `
        SELECT
          id,
          productId,
          name,
          price,
          quantity,
          image
        FROM order_items
        WHERE orderId = ?
        `,
        [order.id]
      );

      order.items = items;
    }

    return res.json(orders);
  } catch (error) {
    console.error("Erreur récupération commandes :", error.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

// ===============================
// UNE COMMANDE VIA SESSION STRIPE
// ===============================
router.get("/by-session/:sessionId", protect, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `
      SELECT
        id,
        userId,
        customerEmail,
        subtotal,
        shipping,
        total,
        stripeSessionId,
        paymentStatus,
        createdAt,
        updatedAt
      FROM orders
      WHERE stripeSessionId = ?
      LIMIT 1
      `,
      [String(req.params.sessionId)]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        error:
          "Commande introuvable. Le webhook Stripe peut encore être en cours de traitement.",
      });
    }

    const order = orders[0];

    const isOwner = String(order.userId) === String(req.user.id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: "Accès interdit à cette commande.",
      });
    }

    const [items] = await pool.execute(
      `
      SELECT
        id,
        productId,
        name,
        price,
        quantity,
        image
      FROM order_items
      WHERE orderId = ?
      `,
      [order.id]
    );

    order.items = items;

    return res.json(order);
  } catch (error) {
    console.error("Erreur récupération commande :", error.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

// ===============================
// TOUTES LES COMMANDES — ADMIN
// ===============================
router.get("/", protect, admin, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `
      SELECT
        o.id,
        o.userId,
        o.customerEmail,
        o.subtotal,
        o.shipping,
        o.total,
        o.stripeSessionId,
        o.paymentStatus,
        o.createdAt,
        o.updatedAt,
        u.nom AS userNom,
        u.email AS userEmail
      FROM orders o
      LEFT JOIN users u ON u.id = o.userId
      ORDER BY o.createdAt DESC
      `
    );

    for (const order of orders) {
      const [items] = await pool.execute(
        `
        SELECT
          id,
          productId,
          name,
          price,
          quantity,
          image
        FROM order_items
        WHERE orderId = ?
        `,
        [order.id]
      );

      order.items = items;
    }

    return res.json(orders);
  } catch (error) {
    console.error("Erreur récupération commandes :", error.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;