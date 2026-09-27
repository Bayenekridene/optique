const express = require("express");
const crypto = require("crypto");

const pool = require("../config/db");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// GET /api/cart
// Récupérer le panier de l'utilisateur connecté
// ======================================================

router.get("/", protect, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        ci.productId,
        ci.quantite,
        p.name,
        p.price,
        p.image,
        p.subtitle,
        p.reference,
        p.description,
        p.stock
      FROM carts c
      INNER JOIN cart_items ci ON ci.cartId = c.id
      INNER JOIN products p ON p.id = ci.productId
      WHERE c.userId = ?
        AND p.isActive = 1
      ORDER BY ci.id
      `,
      [req.user.id]
    );

    return res.json({
      userId: req.user.id,
      items: rows,
    });
  } catch (error) {
    console.error("Erreur récupération panier :", error.message);

    return res.status(500).json({
      message: "Erreur lors de la récupération du panier.",
    });
  }
});

// ======================================================
// POST /api/cart
// Enregistrer / mettre à jour le panier
// ======================================================

router.post("/", protect, async (req, res) => {
  let connection;

  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        message: "Le panier est invalide.",
      });
    }

    if (items.length > 100) {
      return res.status(400).json({
        message: "Le panier contient trop de produits.",
      });
    }

    // --------------------------------------------------
    // Normaliser les produits
    // --------------------------------------------------

    const normalizedItems = new Map();

    for (const item of items) {
      const productId =
        item?.productId ||
        item?.id ||
        item?._id;

      const quantite = Number(
        item?.quantite ??
        item?.quantity ??
        1
      );

      if (
        !productId ||
        typeof productId !== "string"
      ) {
        return res.status(400).json({
          message: "Identifiant produit invalide.",
        });
      }

      if (
        !Number.isInteger(quantite) ||
        quantite < 1 ||
        quantite > 100
      ) {
        return res.status(400).json({
          message: "Quantité invalide.",
        });
      }

      const total =
        (normalizedItems.get(productId) || 0) +
        quantite;

      if (total > 100) {
        return res.status(400).json({
          message:
            "Quantité maximale dépassée pour un produit.",
        });
      }

      normalizedItems.set(productId, total);
    }

    const productIds = [
      ...normalizedItems.keys(),
    ];

    connection = await pool.getConnection();

    await connection.beginTransaction();

    // --------------------------------------------------
    // Récupérer / créer le panier
    // --------------------------------------------------

    let [carts] = await connection.execute(
      `
      SELECT id
      FROM carts
      WHERE userId = ?
      LIMIT 1
      `,
      [req.user.id]
    );

    let cartId;

    if (carts.length === 0) {
      cartId = crypto.randomUUID();

      await connection.execute(
        `
        INSERT INTO carts
        (
          id,
          userId
        )
        VALUES (?, ?)
        `,
        [
          cartId,
          req.user.id,
        ]
      );
    } else {
      cartId = carts[0].id;
    }

    // --------------------------------------------------
    // Panier vide
    // --------------------------------------------------

    if (productIds.length === 0) {
      await connection.execute(
        `
        DELETE FROM cart_items
        WHERE cartId = ?
        `,
        [cartId]
      );

      await connection.commit();

      return res.json({
        userId: req.user.id,
        items: [],
      });
    }

    // --------------------------------------------------
    // Vérifier les produits MySQL
    // --------------------------------------------------

    const placeholders =
      productIds.map(() => "?").join(",");

    const [products] = await connection.execute(
      `
      SELECT
        id,
        name,
        price,
        image,
        subtitle,
        reference,
        description,
        stock
      FROM products
      WHERE id IN (${placeholders})
        AND isActive = 1
      `,
      productIds
    );

    if (products.length !== productIds.length) {
      await connection.rollback();

      return res.status(400).json({
        message:
          "Un ou plusieurs produits sont introuvables ou indisponibles.",
      });
    }

    // --------------------------------------------------
    // Vérifier le stock
    // --------------------------------------------------

    for (const product of products) {
      const quantite =
        normalizedItems.get(product.id);

      if (quantite > product.stock) {
        await connection.rollback();

        return res.status(400).json({
          message:
            `Stock insuffisant pour "${product.name}".`,
        });
      }
    }

    // --------------------------------------------------
    // Remplacer les articles du panier
    // --------------------------------------------------

    await connection.execute(
      `
      DELETE FROM cart_items
      WHERE cartId = ?
      `,
      [cartId]
    );

    for (const productId of productIds) {
      await connection.execute(
        `
        INSERT INTO cart_items
        (
          id,
          cartId,
          productId,
          quantite
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          crypto.randomUUID(),
          cartId,
          productId,
          normalizedItems.get(productId),
        ]
      );
    }

    await connection.commit();

    // --------------------------------------------------
    // Retourner le panier complet
    // --------------------------------------------------

    const [savedItems] = await pool.execute(
      `
      SELECT
        ci.productId,
        ci.quantite,
        p.name,
        p.price,
        p.image,
        p.subtitle,
        p.reference,
        p.description,
        p.stock
      FROM cart_items ci
      INNER JOIN products p
        ON p.id = ci.productId
      WHERE ci.cartId = ?
        AND p.isActive = 1
      ORDER BY ci.id
      `,
      [cartId]
    );

    return res.json({
      userId: req.user.id,
      items: savedItems,
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {}
    }

    console.error(
      "Erreur sauvegarde panier :",
      error.message
    );

    return res.status(500).json({
      message:
        "Impossible de sauvegarder le panier.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;