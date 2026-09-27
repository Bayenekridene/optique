require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("./config/db");

async function fixAdmin() {
  try {
    const email = "bayeneatelier@outlook.fr";

    // CHOISIS TON NOUVEAU MOT DE PASSE ICI
    const nouveauMotDePasse = "loujaynLouay2026";

    const hash = await bcrypt.hash(nouveauMotDePasse, 12);

    const [result] = await pool.execute(
      `
      UPDATE users
      SET
        role = 'admin',
        isApproved = 1,
        password = ?
      WHERE email = ?
      `,
      [hash, email]
    );

    console.log("Résultat :", result.affectedRows, "compte modifié.");
    console.log("ADMIN RÉTABLI :", email);

    await pool.end();
  } catch (error) {
    console.error("ERREUR :", error.message);
  }
}

fixAdmin();