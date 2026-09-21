const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nom: { type: String },
  category: { type: String, required: true },
  categorie: { type: String },
  price: { type: Number, required: true },
  prix: { type: Number },
  image: { type: String, required: true },
  sousTitre: { type: String },
  ref: { type: String },
  reference: { type: String },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);