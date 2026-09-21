const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bayene-optique';

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connexion à MongoDB réussie pour le remplissage (Seeding)..."))
  .catch(err => {
    console.error("Erreur de connexion MongoDB :", err);
    process.exit(1);
  });

// Schéma Produit (adapté à vos champs)
const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  image: String,
  sousTitre: String,
  ref: String,
  description: String
});

const Product = mongoose.model('Product', productSchema);

// Données initiales pour vos collections de lunettes
const sampleProducts = [
  // --- Collection Acétate ---
  {
    name: "Acetate Cat Eye Rose & Motif",
    category: "acetate",
    price: 149,
    image: "https://i.ibb.co/5Gv6Z9v/acetate-1.jpg",
    sousTitre: "L'élégance géométrique en acétate",
    ref: "ACE-001",
    description: "Une monture cat-eye audacieuse alliant des teintes roses et des motifs sophistiqués pour un regard captivant."
  },
  {
    name: "Acetate Cat Eye Rose & Vert",
    category: "acetate",
    price: 159,
    image: "https://i.ibb.co/2k3g5F1/acetate-2.jpg",
    sousTitre: "L'élégance géométrique en acétate",
    ref: "ACE-003",
    description: "Un contraste saisissant entre le rose éclatant et le vert tendre pour un style unique et affirmé."
  },
  {
    name: "Acetate Cat Eye Bleu & Miel",
    category: "acetate",
    price: 149,
    image: "https://i.ibb.co/9V3z8W2/acetate-3.jpg",
    sousTitre: "L'élégance géométrique en acétate",
    ref: "ACE-004",
    description: "Association subtile de nuances bleues et de tons miel chaleureux."
  },
  {
    name: "Acetate Cat Eye Vert Tendre",
    category: "acetate",
    price: 145,
    image: "https://i.ibb.co/4n5K6L7/acetate-4.jpg",
    sousTitre: "L'élégance géométrique en acétate",
    ref: "ACE-005",
    description: "Une monture légère et lumineuse en acétate vert tendre."
  },

  // --- Collection Titane (Exemple pour une autre collection) ---
  {
    name: "Titane Ronde Minimaliste",
    category: "titane",
    price: 189,
    image: "https://i.ibb.co/6P7q8R9/titane-1.jpg",
    sousTitre: "Légereté absolue et résistance",
    ref: "TIT-001",
    description: "Une monture ronde ultra-légère en titane pur, conçue pour un confort quotidien sans compromis sur le style."
  },
  {
    name: "Titane Aviator Dorée",
    category: "titane",
    price: 199,
    image: "https://i.ibb.co/3W2x1Y0/titane-2.jpg",
    sousTitre: "Légereté absolue et résistance",
    ref: "TIT-002",
    description: "La ligne aviateur réinventée dans un alliage de titane aux finitions dorées éclatantes."
  }
];

async function seedDatabase() {
  try {
    // Supprime les anciens produits pour repartir sur une base propre
    await Product.deleteMany({});
    console.log("Anciens produits supprimés.");

await Product.insertMany(sampleProducts);
console.log("Base de données remplie avec succès avec les collections !");
console.log("Base utilisée :", mongoose.connection.db.databaseName);
console.log("Nombre de produits :", await Product.countDocuments());

mongoose.connection.close();
    
    mongoose.connection.close();
  } catch (error) {
    console.error("Erreur lors du remplissage de la base de données :", error);
    mongoose.connection.close();
  }
}

seedDatabase();