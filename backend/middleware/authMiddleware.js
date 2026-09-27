const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Accès non autorisé. Token manquant.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.execute(
      `
      SELECT
        id,
        nom,
        email,
        role,
        isApproved
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Utilisateur introuvable.",
      });
    }

    const user = users[0];

    if (!user.isApproved && user.role !== "admin") {
      return res.status(403).json({
        message:
          "Votre compte n'est pas encore vérifié. Vérifiez votre email.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Erreur auth :", error.message);

    const message =
      error.name === "TokenExpiredError"
        ? "Votre session a expiré. Veuillez vous reconnecter."
        : "Token invalide.";

    return res.status(401).json({ message });
  }
};

const admin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Accès réservé à l'administrateur.",
    });
  }

  next();
};

module.exports = { protect, admin };