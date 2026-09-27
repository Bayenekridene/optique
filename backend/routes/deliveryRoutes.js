
const express = require("express");
const pool = require("../config/db");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// GET /api/delivery
// Lire les paramètres de livraison
// ==========================================

router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `
      SELECT id, type, amount, updatedAt
      FROM delivery_settings
      WHERE id = 1
      LIMIT 1
      `
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Paramètres de livraison introuvables.",
      });
    }

    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// PUT /api/delivery
// Modifier la livraison
// ADMIN UNIQUEMENT
// ==========================================

router.put("/", protect, admin, async (req, res, next) => {
  try {
    const { type, amount } = req.body;

    // Vérifier le type
    if (!["free", "fixed"].includes(type)) {
      return res.status(400).json({
        message:
          "Le type doit être 'free' ou 'fixed'.",
      });
    }

    // Livraison gratuite
    if (type === "free") {
      await pool.execute(
        `
        UPDATE delivery_settings
        SET type = 'free',
            amount = 0
        WHERE id = 1
        `
      );
    }

    // Livraison avec montant
    if (type === "fixed") {
      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount < 0
      ) {
        return res.status(400).json({
          message:
            "Le montant de livraison est invalide.",
        });
      }

      await pool.execute(
        `
        UPDATE delivery_settings
        SET type = 'fixed',
            amount = ?
        WHERE id = 1
        `,
        [numericAmount]
      );
    }

    const [rows] = await pool.execute(
      `
      SELECT id, type, amount, updatedAt
      FROM delivery_settings
      WHERE id = 1
      LIMIT 1
      `
    );

    return res.json({
      message:
        "Paramètres de livraison mis à jour.",
      delivery: rows[0],
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

