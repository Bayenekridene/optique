const express = require("express");
const crypto = require("crypto");

const pool = require("../config/db");
const { protect, admin } = require("../middleware/authMiddleware");
const {
  upload,
  isRealImage,
  removeFile,
} = require("../middleware/upload");

const router = express.Router();

// Adresse publique de l'API
const PUBLIC_URL = (
  process.env.PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const urlFor = (filename) => `${PUBLIC_URL}/uploads/${filename}`;

// Toutes les routes images sont réservées à l'admin
router.use(protect, admin);

// ==========================================
// GET /api/images
// Toutes les images de la galerie
// ==========================================
router.get("/", async (req, res, next) => {
  try {
    const [images] = await pool.execute(`
      SELECT
        id,
        filename,
        url,
        originalName,
        title,
        mimetype,
        size,
        uploadedBy,
        createdAt,
        updatedAt
      FROM images
      ORDER BY createdAt DESC
    `);

    return res.json(images);
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// POST /api/images
// Ajouter une ou plusieurs images
// ==========================================
router.post("/", upload.array("images", 10), async (req, res, next) => {
  const files = req.files || [];

  const cleanAll = () =>
    Promise.all(
      files.map((file) => removeFile(file.filename))
    );

  try {
    if (!files.length) {
      return res.status(400).json({
        message: "Aucune image reçue.",
      });
    }

    // Vérifier que ce sont réellement des images
    for (const file of files) {
      if (!(await isRealImage(file.path))) {
        await cleanAll();

        return res.status(400).json({
          message: `Fichier invalide : ${file.originalname}`,
        });
      }
    }

    const title = String(req.body.title || "").slice(0, 150);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const createdImages = [];

      for (const file of files) {
        const id = crypto.randomUUID();

        const url = urlFor(file.filename);

        await connection.execute(
          `
          INSERT INTO images (
            id,
            filename,
            url,
            originalName,
            title,
            mimetype,
            size,
            uploadedBy
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            id,
            file.filename,
            url,
            String(file.originalname || "").slice(0, 200),
            title,
            file.mimetype || null,
            file.size || null,
            req.user.id,
          ]
        );

        createdImages.push({
          id,
          filename: file.filename,
          url,
          originalName: String(
            file.originalname || ""
          ).slice(0, 200),
          title,
          mimetype: file.mimetype || null,
          size: file.size || null,
          uploadedBy: req.user.id,
        });
      }

      await connection.commit();

      return res.status(201).json(createdImages);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    await cleanAll();
    return next(error);
  }
});

// ==========================================
// PUT /api/images/:id
// Changer le titre et/ou remplacer le fichier
// ==========================================
router.put("/:id", upload.single("image"), async (req, res, next) => {
  let saved = false;

  try {
    const imageId = String(req.params.id);

    const [images] = await pool.execute(
      `
      SELECT *
      FROM images
      WHERE id = ?
      LIMIT 1
      `,
      [imageId]
    );

    if (images.length === 0) {
      await removeFile(req.file?.filename);

      return res.status(404).json({
        message: "Image introuvable.",
      });
    }

    const image = images[0];

    // Seulement changer le titre
    if (!req.file) {
      if (req.body.title !== undefined) {
        const title = String(req.body.title).slice(0, 150);

        await pool.execute(
          `
          UPDATE images
          SET title = ?
          WHERE id = ?
          `,
          [title, imageId]
        );

        image.title = title;
      }

      return res.json(image);
    }

    // Vérifier le nouveau fichier
    if (!(await isRealImage(req.file.path))) {
      await removeFile(req.file.filename);

      return res.status(400).json({
        message: "Fichier invalide.",
      });
    }

    const oldUrl = image.url;
    const oldFilename = image.filename;

    const newUrl = urlFor(req.file.filename);

    const newTitle =
      req.body.title !== undefined
        ? String(req.body.title).slice(0, 150)
        : image.title;

    // Mettre à jour l'image dans MySQL
    await pool.execute(
      `
      UPDATE images
      SET
        filename = ?,
        url = ?,
        originalName = ?,
        title = ?,
        mimetype = ?,
        size = ?
      WHERE id = ?
      `,
      [
        req.file.filename,
        newUrl,
        String(req.file.originalname || "").slice(0, 200),
        newTitle,
        req.file.mimetype || null,
        req.file.size || null,
        imageId,
      ]
    );

    saved = true;

    // Mettre à jour les produits utilisant l'ancienne image
    const [result] = await pool.execute(
      `
      UPDATE products
      SET image = ?
      WHERE image = ?
      `,
      [newUrl, oldUrl]
    );

    // Supprimer l'ancien fichier
    await removeFile(oldFilename);

    const [updatedImages] = await pool.execute(
      `
      SELECT *
      FROM images
      WHERE id = ?
      LIMIT 1
      `,
      [imageId]
    );

    return res.json({
      image: updatedImages[0],
      productsUpdated: result.affectedRows,
    });
  } catch (error) {
    if (!saved) {
      await removeFile(req.file?.filename);
    }

    return next(error);
  }
});

// ==========================================
// DELETE /api/images/:id
// Supprimer une image
// ==========================================
router.delete("/:id", async (req, res, next) => {
  try {
    const imageId = String(req.params.id);

    const [images] = await pool.execute(
      `
      SELECT *
      FROM images
      WHERE id = ?
      LIMIT 1
      `,
      [imageId]
    );

    if (images.length === 0) {
      return res.status(404).json({
        message: "Image introuvable.",
      });
    }

    const image = images[0];

    // Vérifier si un produit utilise encore cette image
    const [usedProducts] = await pool.execute(
      `
      SELECT COUNT(*) AS count
      FROM products
      WHERE image = ?
      `,
      [image.url]
    );

    const used = Number(usedProducts[0].count);

    if (used > 0) {
      return res.status(409).json({
        message: `Image utilisée par ${used} produit(s). Change d'abord l'image de ces produits.`,
      });
    }

    await pool.execute(
      `
      DELETE FROM images
      WHERE id = ?
      `,
      [imageId]
    );

    await removeFile(image.filename);

    return res.json({
      message: "Image supprimée.",
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;