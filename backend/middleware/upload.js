const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

// Sur le VPS : UPLOAD_DIR=/var/www/bayanoptic/uploads (dans .env)
// En local : dossier backend/uploads
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Formats autorisés (pas de SVG : il peut contenir du JavaScript)
const TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  // Nom aléatoire : on n'utilise jamais le nom envoyé par le navigateur
  filename: (req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${TYPES[file.mimetype]}`
    ),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5 Mo max, 10 fichiers max
  fileFilter: (req, file, cb) => {
    if (TYPES[file.mimetype]) return cb(null, true);
    const err = new Error("Format refusé : JPG, PNG ou WEBP uniquement.");
    err.status = 400;
    return cb(err);
  },
});

// Vérifie le vrai contenu du fichier (signature binaire), pas seulement l'extension
async function isRealImage(filePath) {
  const fh = await fsp.open(filePath, "r");
  const buf = Buffer.alloc(12);
  try {
    await fh.read(buf, 0, 12, 0);
  } finally {
    await fh.close();
  }
  const jpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const webp =
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP";
  return jpg || png || webp;
}

function removeFile(filename) {
  if (!filename) return Promise.resolve();
  return fsp
    .unlink(path.join(UPLOAD_DIR, path.basename(filename)))
    .catch(() => {});
}

module.exports = { upload, UPLOAD_DIR, isRealImage, removeFile };
