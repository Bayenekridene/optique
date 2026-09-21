const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Order = require('../models/Order');
const { protect, admin } = require('../middleware/authMiddleware');

// ======================================================
// GET /api/orders/by-session/:sessionId
// UTILISATEUR CONNECTÉ
// ======================================================

router.get(
  '/by-session/:sessionId',
  protect,
  async (req, res) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          error: 'Session Stripe invalide.'
        });
      }

      const order =
        await Order.findOne({
          stripeSessionId: sessionId
        });

      if (!order) {
        return res.status(404).json({
          error: 'Commande introuvable.'
        });
      }

      // ==================================================
      // 🔒 SÉCURITÉ
      // L'utilisateur ne peut voir que sa commande.
      // L'admin peut voir toutes les commandes.
      // ==================================================

      const isAdmin =
        req.user.role === 'admin' ||
        req.user.isAdmin === true;

      if (
        !isAdmin &&
        order.userId.toString() !==
          req.user._id.toString()
      ) {
        return res.status(403).json({
          error:
            'Accès interdit à cette commande.'
        });
      }

      return res.json(order);

    } catch (error) {
      console.error(
        '❌ Erreur récupération commande :',
        error
      );

      return res.status(500).json({
        error: 'Erreur serveur.'
      });
    }
  }
);

// ======================================================
// GET /api/orders
// ADMIN UNIQUEMENT
// ======================================================

router.get(
  '/',
  protect,
  admin,
  async (req, res) => {
    try {
      const orders =
        await Order.find()
          .sort({
            createdAt: -1
          });

      return res.json(orders);

    } catch (error) {
      console.error(
        '❌ Erreur récupération commandes :',
        error
      );

      return res.status(500).json({
        error: 'Erreur serveur.'
      });
    }
  }
);

// ======================================================
// GET /api/orders/my-orders
// UTILISATEUR CONNECTÉ
// ======================================================

router.get(
  '/my-orders',
  protect,
  async (req, res) => {
    try {
      const orders =
        await Order.find({
          userId: req.user._id
        }).sort({
          createdAt: -1
        });

      return res.json(orders);

    } catch (error) {
      console.error(
        '❌ Erreur récupération commandes utilisateur :',
        error
      );

      return res.status(500).json({
        error: 'Erreur serveur.'
      });
    }
  }
);

module.exports = router;