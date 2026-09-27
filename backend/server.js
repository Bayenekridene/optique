
const dns = require("dns");
const express = require("express");
const cors = require("cors");

require("dotenv").config();

// Utile en local sous Windows pour MongoDB Atlas
// (sans effet gênant sur le VPS)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { UPLOAD_DIR } = require("./middleware/upload");

const app = express();

// Le VPS est derrière Nginx
app.set("trust proxy", 1);
app.disable("x-powered-by");

// ==========================================
// CORS
// ==========================================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.NODE_ENV !== "production" &&
    "http://localhost:3000",
  process.env.NODE_ENV !== "production" &&
    "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error("Origine non autorisée par CORS.")
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: true,
  })
);

// ==========================================
// STRIPE WEBHOOK
// IMPORTANT : AVANT express.json()
// ==========================================

app.use(
  "/api/stripe",
  require("./routes/stripeWebhookRoutes")
);

// ==========================================
// JSON
// ==========================================

app.use(
  express.json({
    limit: "1mb",
  })
);

// ==========================================
// IMAGES PUBLIQUES
// ==========================================

app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "30d",
    index: false,
    dotfiles: "deny",

    setHeaders: (res) => {
      res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
      );

      res.setHeader(
        "Cross-Origin-Resource-Policy",
        "cross-origin"
      );
    },
  })
);

// ==========================================
// VÉRIFICATION VARIABLES ENV
// ==========================================

for (const key of [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "JWT_SECRET",
  "STRIPE_SECRET_KEY",
  "FRONTEND_URL",
]) {
  if (!process.env[key]) {
    console.error(
      `${key} est absent des variables d'environnement (.env).`
    );

    process.exit(1);
  }
}

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API Bayan Optic opérationnelle",
  });
});

// ==========================================
// ROUTES API
// ==========================================

app.use(
  "/api/products",
  require("./routes/productRoutes")
);

app.use(
  "/api/images",
  require("./routes/imageRoutes")
);

app.use(
  "/api/cart",
  require("./routes/cartRoutes")
);

app.use(
  "/api/users",
  require("./routes/userRoutes")
);

app.use(
  "/api/payment",
  require("./routes/paymentRoutes")
);

app.use(
  "/api/orders",
  require("./routes/orderRoutes")
);

// ⭐ NOUVELLE ROUTE LIVRAISON
app.use(
  "/api/delivery",
  require("./routes/deliveryRoutes")
);

// ==========================================
// ROUTE INEXISTANTE
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    message: "Route introuvable.",
  });
});

// ==========================================
// GESTION DES ERREURS
// ==========================================

app.use(
  (err, req, res, next) => {
    console.error(
      "Erreur serveur :",
      err.message
    );

    // CORS
    if (
      err.message ===
      "Origine non autorisée par CORS."
    ) {
      return res.status(403).json({
        message: "Origine non autorisée.",
      });
    }

    // Upload fichiers
    if (err.name === "MulterError") {
      const messages = {
        LIMIT_FILE_SIZE:
          "Image trop lourde (5 Mo maximum).",

        LIMIT_FILE_COUNT:
          "10 images maximum à la fois.",

        LIMIT_UNEXPECTED_FILE:
          "Champ de fichier inattendu.",
      };

      return res.status(400).json({
        message:
          messages[err.code] ||
          err.message,
      });
    }

    const status =
      err.status || 500;

    return res.status(status).json({
      message:
        status === 500 &&
        process.env.NODE_ENV ===
          "production"
          ? "Erreur interne du serveur."
          : err.message ||
            "Erreur interne du serveur.",
    });
  }
);

// ==========================================
// SERVEUR
// ==========================================

const PORT =
  Number(process.env.PORT) || 5000;

// 127.0.0.1 en production :
// accessible uniquement via Nginx
const HOST =
  process.env.NODE_ENV ===
  "production"
    ? "127.0.0.1"
    : "0.0.0.0";

app.listen(
  PORT,
  HOST,
  () => {
    console.log(
      `Serveur démarré sur ${HOST}:${PORT}`
    );
  }
);

