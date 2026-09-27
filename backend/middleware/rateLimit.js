const rateLimit = require("express-rate-limit");

// Protection contre les essais de mots de passe en boucle
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // 20 essais max par IP
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Trop de tentatives. Réessayez dans 15 minutes." },
});

module.exports = { authLimiter };
