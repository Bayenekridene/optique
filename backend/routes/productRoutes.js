const express = require("express");
const crypto = require("crypto");

const pool = require("../config/db");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// GET /api/products
// Produits publics actifs
// ======================================================

router.get("/", async (req, res) => {
  try {
    const [products] = await pool.execute(
      `
      SELECT
        id,
        name,
        category,
        price,
        image,
        subtitle,
        reference,
        description,
        stock,
        isActive,
        createdAt,
        updatedAt
      FROM products
      WHERE isActive = 1
      ORDER BY createdAt DESC
      `
    );

    return res.json(products);
  } catch (error) {
    console.error("Erreur GET produits :", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération des produits.",
    });
  }
});

// ======================================================
// GET /api/products/admin/all
// Tous les produits — admin
// ======================================================

router.get("/admin/all", protect, admin, async (req, res) => {
  try {
    const [products] = await pool.execute(
      `
      SELECT
        id,
        name,
        category,
        price,
        image,
        subtitle,
        reference,
        description,
        stock,
        isActive,
        createdAt,
        updatedAt
      FROM products
      ORDER BY createdAt DESC
      `
    );

    return res.json(products);
  } catch (error) {
    console.error("Erreur GET admin produits :", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération des produits.",
    });
  }
});

// ======================================================
// GET /api/products/:id
// Un produit public
// ======================================================

router.get("/:id", async (req, res) => {
  try {
    const [products] = await pool.execute(
      `
      SELECT
        id,
        name,
        category,
        price,
        image,
        subtitle,
        reference,
        description,
        stock,
        isActive,
        createdAt,
        updatedAt
      FROM products
      WHERE id = ? AND isActive = 1
      LIMIT 1
      `,
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        message: "Produit introuvable.",
      });
    }

    return res.json(products[0]);
  } catch (error) {
    console.error("Erreur GET produit :", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération du produit.",
    });
  }
});

// ======================================================
// POST /api/products
// Ajouter un produit — admin
// ======================================================

router.post("/", protect, admin, async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      image,
      subtitle,
      reference,
      description,
      stock,
      isActive,
    } = req.body;

    if (!name || !category || price === undefined || !image) {
      return res.status(400).json({
        message: "Nom, catégorie, prix et image sont obligatoires.",
      });
    }

    const id = crypto.randomUUID();

    const finalStock =
      stock === undefined ? 0 : Number(stock);

    const finalIsActive =
      isActive === undefined ? 1 : (Boolean(isActive) ? 1 : 0);

    await pool.execute(
      `
      INSERT INTO products
      (
        id,
        name,
        category,
        price,
        image,
        subtitle,
        reference,
        description,
        stock,
        isActive
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        name,
        category,
        Number(price),
        image,
        subtitle || "",
        reference || null,
        description || "",
        finalStock,
        finalIsActive,
      ]
    );

    const [products] = await pool.execute(
      `
      SELECT *
      FROM products
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    return res.status(201).json(products[0]);
  } catch (error) {
    console.error("Erreur POST produit :", error);

    return res.status(400).json({
      message: error.message,
    });
  }
});

// ======================================================
// PUT /api/products/:id
// Modifier un produit — admin
// ======================================================

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "category",
      "price",
      "image",
      "subtitle",
      "reference",
      "description",
      "stock",
      "isActive",
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        let value = req.body[field];

        if (field === "price") {
          value = Number(value);
        }

        if (field === "stock") {
          value = Number(value);
        }

        if (field === "isActive") {
          value = Boolean(value) ? 1 : 0;
        }

        if (field === "reference" && value === "") {
          value = null;
        }

        updates.push(`${field} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: "Aucune modification fournie.",
      });
    }

    values.push(req.params.id);

    const [result] = await pool.execute(
      `
      UPDATE products
      SET ${updates.join(", ")}
      WHERE id = ?
      `,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Produit introuvable.",
      });
    }

    const [products] = await pool.execute(
      `
      SELECT *
      FROM products
      WHERE id = ?
      LIMIT 1
      `,
      [req.params.id]
    );

    return res.json(products[0]);
  } catch (error) {
    console.error("Erreur PUT produit :", error);

    return res.status(400).json({
      message: error.message,
    });
  }
});

// ======================================================
// DELETE /api/products/:id
// Désactiver un produit — admin
// ======================================================

router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const [result] = await pool.execute(
      `
      UPDATE products
      SET isActive = 0
      WHERE id = ?
      `,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Produit introuvable.",
      });
    }

    return res.json({
      message: "Produit désactivé avec succès.",
    });
  } catch (error) {
    console.error("Erreur DELETE produit :", error);

    return res.status(500).json({
      message: "Erreur lors de la désactivation du produit.",
    });
  }
});

module.exports = router;