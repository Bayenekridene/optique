const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// ======================================================
// DNS
// ======================================================

dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

// ======================================================
// CORS
// ======================================================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Autorise les requêtes sans origin
      // (ex: certains outils backend)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origine non autorisée par CORS.'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

// ======================================================
// WEBHOOK STRIPE
// IMPORTANT : AVANT express.json()
// ======================================================

app.use(
  '/api/stripe',
  require('./routes/stripeWebhookRoutes')
);

// ======================================================
// MIDDLEWARE JSON
// ======================================================

app.use(
  express.json({
    limit: '1mb'
  })
);

// ======================================================
// CONNEXION À MONGODB
// ======================================================

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI est absent des variables d’environnement.');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connecté à MongoDB avec succès');
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion à MongoDB :', err);
    process.exit(1);
  });

// ======================================================
// ROUTES
// ======================================================

app.use(
  '/api/products',
  require('./routes/productRoutes')
);

app.use(
  '/api/cart',
  require('./routes/cartRoutes')
);

app.use(
  '/api/users',
  require('./routes/userRoutes')
);

app.use(
  '/api/payment',
  require('./routes/paymentRoutes')
);

app.use(
  '/api/orders',
  require('./routes/orderRoutes')
);

// ======================================================
// ROUTE DE TEST
// ======================================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Bayene opérationnelle'
  });
});

// ======================================================
// ROUTE 404
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    message: 'Route introuvable.'
  });
});

// ======================================================
// GESTION DES ERREURS
// ======================================================

app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur :', err.message);

  if (err.message === 'Origine non autorisée par CORS.') {
    return res.status(403).json({
      message: 'Origine non autorisée.'
    });
  }

  res.status(500).json({
    message: 'Erreur interne du serveur.'
  });
});

// ======================================================
// SERVEUR
// ======================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});