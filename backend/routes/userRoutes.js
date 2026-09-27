const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const pool = require("../config/db");
const transporter = require("../config/email");
const { protect, admin } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimit");

const router = express.Router();

const createToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

// ======================================================
// UTILITAIRES
// ======================================================

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]
  );

const FROM = () => `"Bayan Optic" <${process.env.EMAIL_FROM}>`;

// ======================================================
// INSCRIPTION
// POST /api/users
// POST /api/users/register
// ======================================================

router.post(["/", "/register"], authLimiter, async (req, res) => {
  try {
    const { nom, email, password } = req.body;

    if (!nom || !email || !password) {
      return res.status(400).json({
        message: "Nom, email et mot de passe sont obligatoires.",
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const [existingUsers] = await pool.execute(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Cet email est déjà utilisé.",
      });
    }

    const id = crypto.randomUUID();

    const hashedPassword = await bcrypt.hash(String(password), 12);

    const confirmToken = crypto.randomBytes(32).toString("hex");

    const confirmExpire = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await pool.execute(
      `
      INSERT INTO users
      (
        id,
        nom,
        email,
        password,
        role,
        isApproved,
        confirmToken,
        confirmExpire
      )
      VALUES (?, ?, ?, ?, 'client', 0, ?, ?)
      `,
      [
        id,
        String(nom).trim(),
        normalizedEmail,
        hashedPassword,
        confirmToken,
        confirmExpire,
      ]
    );

    const confirmLink =
      `${process.env.FRONTEND_URL}/verify-email/${confirmToken}`;

    try {
      await transporter.sendMail({
        from: FROM(),
        to: normalizedEmail,
        subject: "Confirmez votre compte Bayan Optic",
        html: `
          <p>Bonjour ${escapeHtml(String(nom).trim())},</p>

          <p>
            Merci pour votre inscription sur Bayan Optic.
          </p>

          <p>
            <a href="${confirmLink}">
              Confirmer mon adresse email
            </a>
          </p>

          <p>
            Après confirmation de votre adresse email,
            votre compte restera en attente de validation
            par notre administrateur.
          </p>
        `,
      });
    } catch (mailError) {
      console.error("Erreur envoi e-mail :", mailError.message);

      await pool.execute(
        `
        DELETE FROM users
        WHERE id = ?
        `,
        [id]
      );

      return res.status(500).json({
        message:
          "Impossible d'envoyer l'e-mail de confirmation. Réessayez plus tard.",
      });
    }

    return res.status(201).json({
      message:
        "Inscription réussie. Vérifiez votre email. Votre compte devra ensuite être approuvé par l'administrateur.",
    });
  } catch (error) {
    console.error("Erreur inscription :", error);

    return res.status(500).json({
      message: "Erreur lors de l'inscription.",
    });
  }
});

// ======================================================
// CONFIRMATION EMAIL
// POST /api/users/verify-email
// ======================================================

router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        message: "Token manquant.",
      });
    }

    const [users] = await pool.execute(
      `
      SELECT id
      FROM users
      WHERE confirmToken = ?
        AND confirmExpire > NOW()
      LIMIT 1
      `,
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        message: "Lien invalide ou expiré.",
      });
    }

    // IMPORTANT :
    // La confirmation de l'email NE valide PAS le compte.
    // L'administrateur devra encore approuver le client.

    await pool.execute(
      `
      UPDATE users
      SET
        confirmToken = NULL,
        confirmExpire = NULL
      WHERE id = ?
      `,
      [users[0].id]
    );

    return res.json({
      message:
        "Email confirmé avec succès. Votre compte est maintenant en attente d'approbation par l'administrateur.",
    });
  } catch (error) {
    console.error("Erreur confirmation email :", error);

    return res.status(500).json({
      message: error.message,
    });
  }
});

// ======================================================
// CONNEXION
// POST /api/users/login
// ======================================================

router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email et mot de passe obligatoires.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const [users] = await pool.execute(
      `
      SELECT
        id,
        nom,
        email,
        password,
        role,
        isApproved
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    const user = users[0];

    const passwordCorrect = await bcrypt.compare(
      String(password),
      user.password
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect.",
      });
    }

    // L'admin peut toujours se connecter.
    // Le client doit être approuvé par l'administrateur.

    if (!user.isApproved && user.role !== "admin") {
      return res.status(403).json({
        message:
          "Votre compte est en attente d'approbation par l'administrateur.",
      });
    }

    const token = createToken(user.id);

    return res.json({
      message: "Connexion réussie.",
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        isApproved: Boolean(user.isApproved),
      },
    });
  } catch (error) {
    console.error("Erreur connexion :", error);

    return res.status(500).json({
      message: error.message,
    });
  }
});

// ======================================================
// MOT DE PASSE OUBLIÉ
// POST /api/users/forgot-password
// ======================================================

router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const response = {
      message:
        "Si cette adresse existe, un email de réinitialisation a été envoyé.",
    };

    if (!email) {
      return res.json(response);
    }

    const [users] = await pool.execute(
      `
      SELECT id, nom, email
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    if (users.length === 0) {
      return res.json(response);
    }

    const user = users[0];

    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetExpire = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await pool.execute(
      `
      UPDATE users
      SET
        resetToken = ?,
        resetExpire = ?
      WHERE id = ?
      `,
      [resetToken, resetExpire, user.id]
    );

    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: FROM(),
      to: user.email,
      subject: "Réinitialisation du mot de passe — Bayan Optic",
      html: `
        <p>Bonjour ${escapeHtml(user.nom)},</p>

        <p>
          <a href="${resetLink}">
            Réinitialiser mon mot de passe
          </a>
        </p>

        <p>Ce lien expire dans une heure.</p>
      `,
    });

    return res.json(response);
  } catch (error) {
    console.error("Erreur mot de passe oublié :", error);

    return res.status(500).json({
      message: error.message,
    });
  }
});

// ======================================================
// NOUVEAU MOT DE PASSE
// POST /api/users/reset-password/:token
// ======================================================

router.post("/reset-password/:token", authLimiter, async (req, res) => {
  try {
    const { password } = req.body;

    if (
      !password ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message:
          "Le mot de passe doit contenir au moins 8 caractères.",
      });
    }

    const [users] = await pool.execute(
      `
      SELECT id
      FROM users
      WHERE resetToken = ?
        AND resetExpire > NOW()
      LIMIT 1
      `,
      [req.params.token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        message: "Lien invalide ou expiré.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      String(password),
      12
    );

    await pool.execute(
      `
      UPDATE users
      SET
        password = ?,
        resetToken = NULL,
        resetExpire = NULL
      WHERE id = ?
      `,
      [hashedPassword, users[0].id]
    );

    return res.json({
      message: "Mot de passe modifié avec succès.",
    });
  } catch (error) {
    console.error("Erreur reset password :", error);

    return res.status(500).json({
      message: error.message,
    });
  }
});

// ======================================================
// TOUS LES UTILISATEURS — ADMIN
// GET /api/users
// ======================================================

router.get("/", protect, admin, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `
      SELECT
        id,
        nom,
        email,
        role,
        isApproved,
        createdAt,
        updatedAt
      FROM users
      ORDER BY createdAt DESC
      `
    );

    return res.json(users);
  } catch (error) {
    console.error("Erreur GET utilisateurs :", error);

    return res.status(500).json({
      message: error.message,
    });
  }
});

// ======================================================
// MODIFIER UN UTILISATEUR — ADMIN
// PUT /api/users/:id
// ======================================================

router.put("/:id", protect, admin, async (req, res) => {
  try {
    const allowedFields = ["nom", "role", "isApproved"];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        let value = req.body[field];

        if (field === "isApproved") {
          value = Boolean(value) ? 1 : 0;
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
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = ?
      `,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    const [users] = await pool.execute(
      `
      SELECT
        id,
        nom,
        email,
        role,
        isApproved,
        createdAt,
        updatedAt
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [req.params.id]
    );

    return res.json(users[0]);
  } catch (error) {
    console.error("Erreur PUT utilisateur :", error);

    return res.status(400).json({
      message: error.message,
    });
  }
});

// ======================================================
// SUPPRIMER UN UTILISATEUR — ADMIN
// DELETE /api/users/:id
// ======================================================

router.delete("/:id", protect, admin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        message:
          "Vous ne pouvez pas supprimer votre propre compte.",
      });
    }

    const [result] = await pool.execute(
      `
      DELETE FROM users
      WHERE id = ?
      `,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    return res.json({
      message: "Utilisateur supprimé.",
    });
  } catch (error) {
    console.error("Erreur DELETE utilisateur :", error);

    return res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;