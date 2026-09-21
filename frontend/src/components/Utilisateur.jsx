import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../features/cartSlice";
import { ShoppingBag, ArrowLeft, Check, Eye, Lock, User } from "lucide-react";
import { getProducts, getProductById } from "../services/api";
import logoBayene from "../assets/logo-bayene.png";
import backgroundImage from "../assets/bg-bayene.jpg";

export function CollectionsOverview() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const res = await getProducts();
        const products = res.data || res;
        
        if (Array.isArray(products)) {
          const uniqueCategories = {};
          products.forEach(p => {
            const catId = p.category || p.categorie;
            if (catId && !uniqueCategories[catId]) {
              uniqueCategories[catId] = {
                id: catId,
                title: catId.charAt(0).toUpperCase() + catId.slice(1).replace(/-/g, ' '),
                subtitle: p.sousTitre || "Découvrez notre sélection exclusive",
                sampleImage: p.image || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop"
              };
            }
          });
          setCollections(Object.values(uniqueCategories));
        }
      } catch (err) {
        console.error("Erreur chargement collections:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return (
    <div className="relative min-h-screen pt-32 pb-28 px-6 sm:px-10 lg:px-16 flex flex-col justify-between overflow-x-hidden bg-black">
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center z-0 pointer-events-none"
        style={{ backgroundImage: `url(${backgroundImage})`, opacity: 0.5 }}
      />
      <div className="absolute inset-0 bg-black/5 z-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10 w-full">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-6xl font-serif text-white font-light tracking-wide">
            Nos Collections
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
            Plongez dans nos univers de lunetterie d'exception, pensés pour sublimer chaque regard avec élégance.
          </p>
          <div className="w-16 h-[1px] bg-[#9E6B6B] mx-auto mt-6" />
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral-400 font-mono text-xs uppercase tracking-widest">
            Chargement des collections...
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-20 text-neutral-400 text-sm">
            Aucune collection trouvée dans la base de données.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {collections.map((col, index) => {
              const slideDirection = index % 2 === 0 ? '-translate-x-24 md:-translate-x-32' : 'translate-x-24 md:translate-x-32';
              
              return (
                <div 
                  key={col.id}
                  onClick={() => navigate(`/collection/${col.id}`)}
                  className={`group cursor-pointer space-y-6 transition-all duration-1000 ease-out transform ${
                    isLoaded ? 'translate-x-0 opacity-100' : `${slideDirection} opacity-0`
                  }`}
                >
                  <div className="relative aspect-[16/11] bg-[#FAF7F5] overflow-hidden border border-[#E8E1DE] shadow-xl group-hover:border-[#9E6B6B] transition-colors duration-500">
                    <img
                      src={col.sampleImage}
                      alt={col.title}
                      className="w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>

                  <div className="space-y-1 px-1">
                    <h2 className="text-2xl font-serif font-light text-white group-hover:text-[#9E6B6B] transition-colors">
                      {col.title}
                    </h2>
                    <p className="text-xs text-neutral-300 font-light tracking-wide">
                      {col.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function CollectionDetail() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiProducts, setApiProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Appels hooks inconditionnels
  const userState = useSelector((state) => state.user);
  const authUser = useSelector((state) => state.auth?.user);
  const currentUser = userState?.userInfo || userState?.currentUser || authUser;

  useEffect(() => {
    setIsLoaded(false);
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [collectionId]);

  useEffect(() => {
    const fetchApiData = async () => {
      try {
        setLoading(true);
        const res = await getProducts();
        const productsData = res.data || res;
        if (Array.isArray(productsData)) {
          setApiProducts(productsData);
        }
      } catch (err) {
        console.error("Erreur de chargement API:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApiData();
  }, []);

  const displayProducts = apiProducts.filter((p) => {
    const cat = p.category || p.categorie || "";
    return cat.toLowerCase().trim() === collectionId.toLowerCase().trim();
  });

  const collectionTitle = collectionId.charAt(0).toUpperCase() + collectionId.slice(1).replace(/-/g, ' ');

  return (
    <div className="relative min-h-screen pt-32 pb-28 px-6 sm:px-10 lg:px-16 flex flex-col justify-between overflow-x-hidden bg-black">
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center z-0 pointer-events-none"
        style={{ backgroundImage: `url(${backgroundImage})`, opacity: 0.5 }}
      />
      <div className="absolute inset-0 bg-black/5 z-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10 w-full">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <button 
            onClick={() => navigate('/collection')}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#3A3230] hover:text-black transition-colors cursor-pointer bg-[#F7F3F2] backdrop-blur-md px-4 py-2 border border-[#9E6B6B]/30 shadow-sm font-medium"
          >
            <ArrowLeft size={16} /> Retour aux collections
          </button>

          {!currentUser && (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white bg-[#9E6B6B] hover:bg-[#8A5A5A] transition-colors px-5 py-2.5 shadow-md"
            >
              <User size={15} /> Espace Connexion
            </Link>
          )}
        </div>

        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-5xl font-serif text-white font-light">
            {collectionTitle}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 font-light">
            Découvrez notre sélection de montures de la collection {collectionTitle}
          </p>
          <div className="w-12 h-[1px] bg-[#9E6B6B] mx-auto mt-4" />
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral-400 font-mono text-xs uppercase tracking-widest">
            Chargement des montures...
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#F7F3F2]/10 backdrop-blur-md border border-[#9E6B6B]/20 p-8">
            <p className="text-sm text-neutral-300 font-light">
              Aucune monture n'est actuellement disponible dans cette collection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {displayProducts.map((product, index) => (
              <ProductCardPradaPowder key={product._id || product.id} product={product} index={index} isLoaded={isLoaded} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCardPradaPowder({ product, index, isLoaded }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  const userState = useSelector((state) => state.user);
  const authUser = useSelector((state) => state.auth?.user);
  const currentUser = userState?.userInfo || userState?.currentUser || authUser;
  
  // Si vous souhaitez afficher les prix à tout le monde sans restriction, mettez canSeePrices = true. 
  // Sinon, s'il faut être connecté : const canSeePrices = Boolean(currentUser);
  const canSeePrices = true; 

  const slideDirection = index % 2 === 0 ? '-translate-x-24 md:-translate-x-32' : 'translate-x-24 md:translate-x-32';
  const prodId = product._id || product.id;
  const prodName = product.name || product.nom;
  const prodPrice = product.price || product.prix;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const itemToCart = {
      id: prodId,
      nom: prodName,
      name: prodName,
      prix: Number(prodPrice),
      price: Number(prodPrice),
      image: product.image,
      ref: product.ref || product.reference,
      quantite: 1
    };

    dispatch(addToCart(itemToCart));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleViewProduct = () => {
    navigate(`/product/${prodId}`);
  };

  return (
    <div 
      onClick={handleViewProduct}
      className={`group cursor-pointer flex flex-col justify-between bg-white/95 backdrop-blur-xl border border-[#E5DCD9] hover:border-[#9E6B6B] transition-all duration-700 ease-out transform shadow-xl ${
        isLoaded ? 'translate-x-0 opacity-100' : `${slideDirection} opacity-0`
      }`}
    >
      <div className="relative aspect-[4/3] bg-[#F9F6F4] overflow-hidden flex items-center justify-center">
        <img
          src={product.image}
          alt={prodName}
          className="w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>

      <div className="p-5 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#8A7A77] uppercase tracking-widest block">
              REF: {product.ref || product.reference || "MODEL-EX"}
            </span>
            <h3 className="text-sm sm:text-base font-serif font-medium text-[#2C2624] group-hover:text-[#9E6B6B] transition-colors">
              {prodName}
            </h3>
          </div>

          <span className="text-sm sm:text-base font-serif font-semibold text-[#9E6B6B] shrink-0">
            {prodPrice} €
          </span>
        </div>

        <div className="pt-2 border-t border-[#EFEAE6] flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleAddToCart}
            className={`flex-1 py-3 text-[10px] font-mono uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              added ? 'bg-[#7A9A82] text-white' : 'bg-[#2C2624] hover:bg-[#9E6B6B] text-white'
            }`}
          >
            {added ? <><Check size={14} /> Ajouté</> : <><ShoppingBag size={14} /> Panier</>}
          </button>

          <button
            onClick={handleViewProduct}
            className="px-3.5 py-3 bg-[#FAF7F5] text-[#2C2624] hover:bg-[#EAE4E1] transition-colors flex items-center justify-center cursor-pointer border border-[#E5DCD9]"
            title="Voir la fiche"
          >
            <Eye size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  const userState = useSelector((state) => state.user);
  const authUser = useSelector((state) => state.auth?.user);
  const currentUser = userState?.userInfo || userState?.currentUser || authUser;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await getProductById(productId);
        const productData = res.data || res;
        if (productData) {
          setProduct(productData);
        }
      } catch (err) {
        console.error("Erreur chargement produit:", err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const prodId = product._id || product.id;
    const prodName = product.name || product.nom;
    const prodPrice = product.price || product.prix;

    const itemToCart = {
      id: prodId,
      nom: prodName,
      name: prodName,
      prix: Number(prodPrice),
      price: Number(prodPrice),
      image: product.image,
      ref: product.ref || product.reference,
      quantite: 1
    };

    dispatch(addToCart(itemToCart));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="relative min-h-screen pt-32 pb-28 px-6 flex items-center justify-center bg-black text-white">
        <div className="absolute inset-0 w-full h-full bg-cover bg-center z-0 pointer-events-none opacity-50" style={{ backgroundImage: `url(${backgroundImage})` }} />
        <p className="relative z-10 text-xs font-mono uppercase tracking-[0.3em] text-[#9E6B6B]">
          Chargement de la monture...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="relative min-h-screen pt-32 pb-28 px-6 flex flex-col items-center justify-center bg-black text-white space-y-6">
        <p className="text-xs uppercase tracking-widest text-neutral-400">Monture introuvable dans la base de données.</p>
        <Link to="/collection" className="px-6 py-3 bg-[#9E6B6B] text-white text-xs uppercase tracking-widest">
          Retour aux collections
        </Link>
      </div>
    );
  }

  const productName = product.name || product.nom;
  const productPrice = product.price || product.prix;
  const productRef = product.ref || product.reference || "MODEL-EX";
  const productDesc = product.description || "Description non disponible pour cette monture.";
  const productImage = product.image || "https://via.placeholder.com/150";

  return (
    <div className="relative min-h-screen pt-32 pb-28 px-6 sm:px-10 lg:px-16 flex flex-col justify-between overflow-x-hidden bg-black">
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center z-0 pointer-events-none"
        style={{ backgroundImage: `url(${backgroundImage})`, opacity: 0.5 }}
      />
      <div className="absolute inset-0 bg-black/5 z-0 pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10 flex-1 flex flex-col">
        <div className="mb-8 flex justify-between items-center">
          <Link
            to="/collection"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#3A3230] hover:text-black transition-colors bg-[#F7F3F2] backdrop-blur-md px-4 py-2 border border-[#9E6B6B]/30 shadow-sm font-medium"
          >
            <ArrowLeft size={16} /> RETOUR
          </Link>

          {!currentUser && (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white bg-[#9E6B6B] hover:bg-[#8A5A5A] transition-colors px-5 py-2.5 shadow-md"
            >
              <User size={15} /> Espace Connexion
            </Link>
          )}
        </div>

        <div className="bg-white/95 backdrop-blur-xl border border-[#E5DCD9] shadow-2xl p-8 sm:p-14 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative h-80 sm:h-96 bg-[#F9F6F4] overflow-hidden border border-[#E8E1DE] flex items-center justify-center">
            <img 
              src={productImage} 
              alt={productName} 
              className="w-full h-full object-cover transform transition-transform duration-700 ease-out hover:scale-105" 
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-[#8A7A77] uppercase tracking-widest">
                REF: {productRef}
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif text-[#2C2624] font-light leading-snug">
                {productName}
              </h1>

              <p className="text-xl font-serif font-semibold text-[#9E6B6B] mt-2">
                {productPrice} €
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#5A4E4C] font-light leading-relaxed font-serif">
              {productDesc}
            </p>

            <div className="pt-4">
              <button
                onClick={handleAddToCart}
                className={`w-full py-4 px-6 text-xs font-medium uppercase tracking-[0.2em] font-mono transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-md ${
                  added ? 'bg-[#7A9A82] text-white' : 'bg-[#2C2624] hover:bg-[#9E6B6B] text-white'
                }`}
              >
                {added ? <><Check size={16} /> Ajouté au panier avec succès</> : <><ShoppingBag size={16} /> Ajouter au panier</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}