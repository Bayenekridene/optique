import React, { useState, useEffect } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getProducts } from "../services/api"; // Import de l'API produits
import bgBayene from "../assets/bg-bayene.jpg";

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les produits depuis le backend MongoDB à l'ouverture du modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetchProducts();
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      setProducts(response.data); // Suppose que votre API renvoie un tableau de produits
    } catch (error) {
      console.error("Erreur lors du chargement des produits pour la recherche :", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filtrer les produits de la base de données en fonction de la saisie
const filteredProducts = query.trim() === "" 
  ? [] 
  : products.filter((product) => {
      const searchLower = query.toLowerCase().trim();
      
      // Recherche par nom
      const nameMatch = (product.nom || product.name || "").toLowerCase().includes(searchLower);
      
      // Recherche par collection / catégorie
      const categoryMatch = (product.categorie || product.category || "").toLowerCase().includes(searchLower);
      
      // Recherche par description
      const descMatch = (product.description || "").toLowerCase().includes(searchLower);
      
      // Recherche par référence
      const refMatch = (product.ref || product.reference || "").toLowerCase().includes(searchLower);
      
      return nameMatch || categoryMatch || descMatch || refMatch;
    });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-2xl transition-all duration-300 text-white overflow-hidden">
      {/* Background utilisant l'image importée depuis les assets */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none filter brightness-125 contrast-105"
        style={{
          backgroundImage: `url(${bgBayene})`,
          opacity: 0.5,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-neutral-950/75 to-black/85 z-0 pointer-events-none" />

      {/* BARRE D'ENTÊTE DE RECHERCHE */}
      <div className="relative z-10 max-w-4xl w-full mx-auto px-6 pt-10 pb-6 flex items-center justify-between border-b border-neutral-800">
        <div className="relative flex-1 flex items-center gap-4">
          <Search size={22} className="text-[#9E6B6B] flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Rechercher une monture, une matière, un style..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-base sm:text-xl font-light text-white placeholder-neutral-500 focus:outline-none tracking-wide font-serif"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-neutral-400 hover:text-white uppercase tracking-widest px-2 cursor-pointer"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          style={{ borderRadius: '0px' }}
          className="ml-6 p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer rounded-none"
          aria-label="Fermer la recherche"
        >
          <X size={24} />
        </button>
      </div>

      {/* ZONE DE RÉSULTATS */}
      <div className="relative z-10 flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-16 text-neutral-400 font-mono text-xs uppercase tracking-widest">
            Chargement des catalogues...
          </div>
        ) : query.trim() === "" ? (
          /* RECHERCHES SUGGÉRÉES QUAND LE CHAMP EST VIDE */
          <div className="space-y-6">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#9E6B6B]">
              Suggestions populaires
            </p>
            <div className="flex flex-wrap gap-3">
              {["Cat-Eye", "Acétate", "Écaille Miel", "Solaire", "Oversize"].map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  style={{ borderRadius: '0px' }}
                  className="bg-neutral-900/90 border border-neutral-800 hover:border-[#9E6B6B] px-6 py-3 text-xs text-neutral-300 hover:text-white transition-all shadow-sm cursor-pointer rounded-none uppercase tracking-widest font-mono"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : filteredProducts.length > 0 ? (
          /* LISTE DES RÉSULTATS TROUVÉS */
          <div className="space-y-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#9E6B6B] mb-4">
              {filteredProducts.length} résultat(s) trouvé(s)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                const productId = product._id || product.id;
                const productName = product.nom || product.name;
                const productCategory = product.categorie || product.category;
                const productPrice = product.prix || product.price;
                const productImage = product.image || "https://via.placeholder.com/150";

                return (
                  <Link
                    key={productId}
                    to={`/product/${productId}`}
                    onClick={onClose}
                    style={{ borderRadius: '0px' }}
                    className="bg-neutral-900/95 backdrop-blur-md p-4 border border-[#9E6B6B]/30 hover:border-[#9E6B6B]/60 hover:shadow-2xl transition-all flex items-center gap-4 group rounded-none"
                  >
                    <div 
                      style={{ borderRadius: '0px' }}
                      className="w-20 h-20 bg-black/50 border border-neutral-800 overflow-hidden flex-shrink-0 p-2 flex items-center justify-center rounded-none"
                    >
                      <img
                        src={productImage}
                        alt={productName}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-xs font-serif font-light text-white truncate group-hover:text-[#9E6B6B] transition-colors">
                        {productName}
                      </h4>
                      <p className="text-[11px] text-neutral-400 font-light">
                        {productCategory}
                      </p>
                      <p className="text-xs font-semibold text-[#9E6B6B] font-mono">
                        {productPrice} €
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-neutral-600 group-hover:text-white group-hover:translate-x-1 transition-all mr-2" />
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          /* CAS : AUCUN RÉSULTAT */
          <div className="text-center py-16 space-y-3">
            <p className="text-sm font-light text-neutral-300 font-serif">
              Aucune monture ne correspond à « <span className="italic text-[#9E6B6B]">{query}</span> »
            </p>
            <p className="text-xs text-neutral-500 font-light font-mono uppercase tracking-wider">
              Essayez un autre mot-clé comme "Cat-Eye", "Solaire" ou "Oversize".
            </p>
          </div>
        )}
      </div>

    </div>
  );
}