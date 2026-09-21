const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

// ======================================================
// RÉCUPÉRER LE PANIER
// ======================================================

router.get('/', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      userId: req.user._id
    }).populate('items.productId');

    return res.json(
      cart || {
        userId: req.user._id,
        items: []
      }
    );

  } catch (err) {
    console.error(
      '❌ Erreur récupération panier :',
      err
    );

    return res.status(500).json({
      message:
        'Erreur lors de la récupération du panier.'
    });
  }
});

// ======================================================
// ENREGISTRER LE PANIER
// ======================================================

router.post('/', protect, async (req, res) => {
  try {
    const { items } = req.body;

    // ==================================================
    // 1. VÉRIFIER LE PANIER
    // ==================================================

    if (!Array.isArray(items)) {
      return res.status(400).json({
        message: 'Le panier est invalide.'
      });
    }

    if (items.length > 100) {
      return res.status(400).json({
        message:
          'Le panier contient trop de produits.'
      });
    }

    const validatedItems = [];

    // ==================================================
    // 2. VÉRIFIER CHAQUE PRODUIT
    // ==================================================

    for (const item of items) {
      if (
        !item ||
        typeof item !== 'object'
      ) {
        return res.status(400).json({
          message:
            'Article du panier invalide.'
        });
      }

      const productId =
        item.productId ||
        item.id ||
        item._id;

      // ==================================================
      // 3. VÉRIFIER L'ID MONGODB
      // ==================================================

      if (
        !productId ||
        !mongoose.isValidObjectId(productId)
      ) {
        return res.status(400).json({
          message:
            'Identifiant produit invalide.'
        });
      }

      // ==================================================
      // 4. VÉRIFIER QUE LE PRODUIT EXISTE
      // ==================================================

      const product =
        await Product.findById(productId);

      if (!product) {
        return res.status(400).json({
          message:
            'Produit introuvable.'
        });
      }

      // ==================================================
      // 5. VÉRIFIER LA QUANTITÉ
      // ==================================================

      const quantite = Number(
        item.quantite ??
        item.quantity ??
        1
      );

      if (
        !Number.isInteger(quantite) ||
        quantite <= 0 ||
        quantite > 100
      ) {
        return res.status(400).json({
          message:
            'Quantité invalide.'
        });
      }

      // ==================================================
      // 6. AJOUTER UNIQUEMENT LES DONNÉES VALIDÉES
      // ==================================================

      validatedItems.push({
        productId: product._id,
        quantite
      });
    }

    // ==================================================
    // 7. CRÉER OU METTRE À JOUR LE PANIER
    // ==================================================

    let cart =
      await Cart.findOne({
        userId: req.user._id
      });

    if (cart) {
      cart.items =
        validatedItems;

      await cart.save();

    } else {
      cart = new Cart({
        userId: req.user._id,
        items: validatedItems
      });

      await cart.save();
    }

    // ==================================================
    // 8. RETOURNER LE PANIER AVEC LES PRODUITS
    // ==================================================

    const populatedCart =
      await cart.populate(
        'items.productId'
      );

    return res.json(
      populatedCart
    );

  } catch (err) {
    console.error(
      '❌ Erreur sauvegarde panier :',
      err
    );

    return res.status(500).json({
      message:
        'Impossible de sauvegarder le panier.'
    });
  }
});

module.exports = router;