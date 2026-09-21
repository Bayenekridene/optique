
const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');

// ======================================================
// 1. OBTENIR TOUS LES PRODUITS
// Public
// ======================================================

router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

// ======================================================
// 2. OBTENIR UN PRODUIT PAR ID
// Public
// ======================================================

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Produit introuvable'
      });
    }

    res.json(product);

  } catch (err) {
    res.status(400).json({
      message: 'ID produit invalide'
    });
  }
});

// ======================================================
// 3. AJOUTER UN PRODUIT
// ADMIN UNIQUEMENT
// ======================================================

router.post('/', protect, admin, async (req, res) => {
  try {
    const {
      name,
      nom,
      category,
      categorie,
      price,
      prix,
      image,
      sousTitre,
      ref,
      reference,
      description,
      stock
    } = req.body;

    const product = new Product({
      name: name || nom,
      nom: nom || name,

      category: category || categorie,
      categorie: categorie || category,

      price: price !== undefined ? Number(price) : Number(prix),
      prix: prix !== undefined ? Number(prix) : Number(price),

      image,
      sousTitre,

      ref: ref || reference,
      reference: reference || ref,

      description,

      stock: stock !== undefined ? Number(stock) : 1
    });

    if (!product.name) {
      return res.status(400).json({
        message: 'Le nom du produit est obligatoire.'
      });
    }

    if (!product.category) {
      return res.status(400).json({
        message: 'La catégorie est obligatoire.'
      });
    }

    if (!product.image) {
      return res.status(400).json({
        message: "L'image du produit est obligatoire."
      });
    }

    if (!Number.isFinite(product.price) || product.price < 0) {
      return res.status(400).json({
        message: 'Le prix est invalide.'
      });
    }

    if (!Number.isInteger(product.stock) || product.stock < 0) {
      return res.status(400).json({
        message: 'Le stock doit être un nombre entier positif ou égal à zéro.'
      });
    }

    const newProduct = await product.save();

    res.status(201).json(newProduct);

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
});

// ======================================================
// 4. MODIFIER UN PRODUIT
// ADMIN UNIQUEMENT
// ======================================================

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const allowedFields = [
      'name',
      'nom',
      'category',
      'categorie',
      'price',
      'prix',
      'image',
      'sousTitre',
      'ref',
      'reference',
      'description',
      'stock'
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);

      if (!Number.isFinite(updates.price) || updates.price < 0) {
        return res.status(400).json({
          message: 'Le prix est invalide.'
        });
      }

      updates.prix = updates.price;
    }

    if (updates.prix !== undefined && updates.price === undefined) {
      updates.prix = Number(updates.prix);

      if (!Number.isFinite(updates.prix) || updates.prix < 0) {
        return res.status(400).json({
          message: 'Le prix est invalide.'
        });
      }

      updates.price = updates.prix;
    }

    if (updates.stock !== undefined) {
      updates.stock = Number(updates.stock);

      if (!Number.isInteger(updates.stock) || updates.stock < 0) {
        return res.status(400).json({
          message: 'Le stock doit être un nombre entier positif ou égal à zéro.'
        });
      }
    }

    if (updates.name !== undefined) {
      updates.nom = updates.name;
    }

    if (updates.nom !== undefined && updates.name === undefined) {
      updates.name = updates.nom;
    }

    if (updates.category !== undefined) {
      updates.categorie = updates.category;
    }

    if (updates.categorie !== undefined && updates.category === undefined) {
      updates.category = updates.categorie;
    }

    if (updates.ref !== undefined) {
      updates.reference = updates.ref;
    }

    if (updates.reference !== undefined && updates.ref === undefined) {
      updates.ref = updates.reference;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: 'Produit introuvable'
      });
    }

    res.json(updatedProduct);

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
});

// ======================================================
// 5. SUPPRIMER UN PRODUIT
// ADMIN UNIQUEMENT
// ======================================================

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!deletedProduct) {
      return res.status(404).json({
        message: 'Produit introuvable'
      });
    }

    res.json({
      message: 'Produit supprimé avec succès'
    });

  } catch (err) {
    res.status(400).json({
      message: 'ID produit invalide'
    });
  }
});

module.exports = router;
