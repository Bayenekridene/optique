import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import { addToCart } from "../features/cartSlice";
import {
  ShoppingBag,
  ArrowLeft,
  Check,
  Lock,
  ArrowUpRight,
  Heart,
} from "lucide-react";

import {
  getProducts,
  getProductById,
  saveCart,
} from "../services/api";

import backgroundImage from "../assets/bg-bayene.jpg";


/* =========================================================
   HOOK REVEAL
========================================================= */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      {
        threshold: 0.12,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}


/* =========================================================
   COLLECTIONS OVERVIEW
========================================================= */

export function CollectionsOverview() {
  const navigate = useNavigate();

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);

        const res = await getProducts();
        const products = res.data || res;

        if (Array.isArray(products)) {
          const uniqueCategories = {};

          products.forEach((product) => {
            const category =
              product.category || product.categorie;

            if (
              category &&
              !uniqueCategories[category]
            ) {
              uniqueCategories[category] = {
                id: category,

                title:
                  category
                    .charAt(0)
                    .toUpperCase() +
                  category
                    .slice(1)
                    .replace(/-/g, " "),

                subtitle:
                  product.sousTitre ||
                  "Élégance intemporelle & silhouettes affirmées",

                sampleImage:
                  product.image ||
                  "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop",

                count: 0,
              };
            }

            if (category) {
              uniqueCategories[category].count += 1;
            }
          });

          setCollections(
            Object.values(uniqueCategories)
          );
        }
      } catch (error) {
        console.error(
          "Erreur chargement collections :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return (
    <div
      className="
        relative
        min-h-screen
        bg-[#FAF7F3]
        text-[#302822]
        overflow-x-hidden
      "
    >
      <div
        className="
          fixed
          inset-0
          bg-cover
          bg-center
          opacity-[0.035]
          pointer-events-none
        "
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />

      <header
        className="
          relative
          pt-32
          sm:pt-40
          pb-20
          sm:pb-28
          px-6
          text-center
        "
      >
        <p
          className="
            text-[9px]
            sm:text-[10px]
            uppercase
            tracking-[0.55em]
            text-[#8B7355]
            mb-7
          "
        >
          Maison Bayene
        </p>

        <h1
          className="
            font-serif
            text-5xl
            sm:text-7xl
            lg:text-9xl
            font-light
            tracking-tight
            leading-none
          "
        >
          Collections
        </h1>

        <div
          className="
            w-px
            h-20
            bg-gradient-to-b
            from-[#D4B8AE]
            to-transparent
            mx-auto
            mt-12
          "
        />
      </header>

      {loading ? (
        <div
          className="
            flex
            justify-center
            items-center
            py-32
          "
        >
          <p
            className="
              text-center
              text-[#8B7355]
              font-mono
              text-[9px]
              uppercase
              tracking-[0.4em]
              animate-pulse
            "
          >
            Ouverture des collections…
          </p>
        </div>
      ) : collections.length === 0 ? (
        <p
          className="
            text-center
            py-24
            text-[#8B7355]
            text-sm
          "
        >
          Aucune collection disponible.
        </p>
      ) : (
        <section
          className="
            relative
            max-w-6xl
            mx-auto
            px-5
            sm:px-8
            pb-32
            sm:pb-40
            space-y-28
            sm:space-y-40
          "
        >
          {collections.map(
            (collection, index) => (
              <CollectionRow
                key={collection.id}
                col={collection}
                index={index}
                onOpen={() =>
                  navigate(
                    `/collection/${collection.id}`
                  )
                }
              />
            )
          )}
        </section>
      )}
    </div>
  );
}


/* =========================================================
   COLLECTION ROW
========================================================= */

function CollectionRow({
  col,
  index,
  onOpen,
}) {
  const [ref, visible] = useReveal();

  const reversed = index % 2 === 1;

  return (
    <article
      ref={ref}
      onClick={onOpen}
      className={`
        group
        grid
        grid-cols-1
        lg:grid-cols-12
        items-center
        gap-10
        lg:gap-14
        cursor-pointer
        transition-all
        duration-[1200ms]
        ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-16"
        }
      `}
    >
      <div
        className={`
          lg:col-span-7
          ${reversed ? "lg:order-2" : ""}
        `}
      >
        <div
          className="
            relative
            overflow-hidden
            aspect-[4/3]
            bg-[#EEE6DF]
          "
        >
          <img
            src={col.sampleImage}
            alt={col.title}
            className="
              w-full
              h-full
              object-cover
              transition-transform
              duration-[1200ms]
              group-hover:scale-105
            "
          />

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-tr
              from-[#302822]/10
              via-transparent
              to-[#D4B8AE]/10
              opacity-70
            "
          />

          <div
            className="
              absolute
              inset-0
              border
              border-white/30
            "
          />
        </div>
      </div>

      <div
        className={`
          lg:col-span-5
          px-1
          ${reversed ? "lg:order-1 lg:text-right" : ""}
        `}
      >
        <span
          className="
            font-mono
            text-[8px]
            sm:text-[9px]
            tracking-[0.4em]
            text-[#8B7355]
          "
        >
          {String(index + 1).padStart(2, "0")}
          {" — "}
          {col.count} PIÈCES
        </span>

        <h2
          className="
            font-serif
            text-4xl
            sm:text-5xl
            lg:text-7xl
            font-light
            mt-4
            leading-[1.05]
            text-[#302822]
            transition-colors
            duration-500
            group-hover:text-[#9C7665]
          "
        >
          {col.title}
        </h2>

        <p
          className={`
            text-sm
            text-[#8B7355]
            font-light
            leading-relaxed
            mt-6
            max-w-sm
            ${
              reversed
                ? "lg:ml-auto"
                : ""
            }
          `}
        >
          {col.subtitle}
        </p>

        <div
          className={`
            inline-flex
            items-center
            gap-4
            mt-8
            ${
              reversed
                ? "lg:flex-row-reverse"
                : ""
            }
          `}
        >
          <span
            className="
              relative
              text-[9px]
              uppercase
              tracking-[0.35em]
              text-[#302822]
            "
          >
            Découvrir

            <span
              className="
                absolute
                left-0
                -bottom-2
                w-full
                h-px
                bg-[#D4B8AE]
                scale-x-0
                origin-left
                transition-transform
                duration-500
                group-hover:scale-x-100
              "
            />
          </span>

          <ArrowUpRight
            size={17}
            strokeWidth={1.5}
            className="
              text-[#B99483]
              transition-transform
              duration-500
              group-hover:translate-x-1
              group-hover:-translate-y-1
            "
          />
        </div>
      </div>
    </article>
  );
}


/* =========================================================
   COLLECTION DETAIL
========================================================= */

export function CollectionDetail() {
  const { collectionId } = useParams();
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] =
    useState(false);

  const [apiProducts, setApiProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    setIsLoaded(false);

    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [collectionId]);

  useEffect(() => {
    const fetchApiData = async () => {
      try {
        setLoading(true);

        const res = await getProducts();

        const productsData =
          res.data || res;

        if (Array.isArray(productsData)) {
          setApiProducts(productsData);
        }
      } catch (error) {
        console.error(
          "Erreur de chargement API :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApiData();
  }, []);

  const displayProducts =
    apiProducts.filter((product) => {
      const category =
        product.category ||
        product.categorie ||
        "";

      return (
        category
          .toLowerCase()
          .trim() ===
        (collectionId || "")
          .toLowerCase()
          .trim()
      );
    });

  const collectionTitle =
    (collectionId || "")
      .charAt(0)
      .toUpperCase() +
    (collectionId || "")
      .slice(1)
      .replace(/-/g, " ");

  return (
    <div
      className="
        relative
        min-h-screen
        bg-[#FAF7F3]
        text-[#302822]
        pt-28
        sm:pt-32
        pb-28
        px-4
        sm:px-8
        lg:px-16
        overflow-x-hidden
      "
    >
      <div
        className="
          fixed
          inset-0
          bg-cover
          bg-center
          opacity-[0.035]
          pointer-events-none
        "
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />

      <div
        className="
          relative
          z-10
          max-w-7xl
          mx-auto
          w-full
        "
      >
        <button
          onClick={() =>
            navigate("/collection")
          }
          className="
            group
            inline-flex
            items-center
            gap-3
            text-[8px]
            sm:text-[9px]
            uppercase
            tracking-[0.35em]
            text-[#302822]
            transition-all
            duration-500
            hover:text-[#B99483]
          "
        >
          <ArrowLeft
            size={14}
            strokeWidth={1.5}
            className="
              transition-transform
              duration-300
              group-hover:-translate-x-1
            "
          />

          Retour aux collections
        </button>

        <div
          className="
            text-center
            max-w-3xl
            mx-auto
            pt-16
            sm:pt-20
            pb-14
            sm:pb-20
          "
        >
          <p
            className="
              text-[8px]
              sm:text-[9px]
              uppercase
              tracking-[0.6em]
              text-[#8B7355]
              mb-5
            "
          >
            Collection
          </p>

          <h1
            className="
              font-serif
              text-5xl
              sm:text-7xl
              lg:text-8xl
              font-light
              leading-none
            "
          >
            {collectionTitle}
          </h1>

          <div
            className="
              w-px
              h-16
              bg-gradient-to-b
              from-[#D4B8AE]
              to-transparent
              mx-auto
              mt-10
            "
          />
        </div>

        {loading ? (
          <div className="py-28 text-center">
            <p
              className="
                text-[#8B7355]
                font-mono
                text-[9px]
                uppercase
                tracking-[0.4em]
                animate-pulse
              "
            >
              Chargement des montures…
            </p>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="py-28 text-center">
            <p
              className="
                text-[#8B7355]
                font-light
                text-sm
              "
            >
              Aucune monture n'est
              actuellement disponible dans
              cette collection.
            </p>
          </div>
        ) : (
          <div
            className="
              grid
              grid-cols-2
              md:grid-cols-3
              xl:grid-cols-4
              gap-x-4
              sm:gap-x-7
              lg:gap-x-9
              gap-y-14
              sm:gap-y-16
              lg:gap-y-20
            "
          >
            {displayProducts.map(
              (product, index) => (
                <ProductCardModern
                  key={
                    product._id ||
                    product.id
                  }
                  product={product}
                  index={index}
                  isLoaded={isLoaded}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}


/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCardModern({
  product,
  index,
  isLoaded,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [added, setAdded] =
    useState(false);

  const [liked, setLiked] =
    useState(false);

  const [isHovered, setIsHovered] =
    useState(false);

  const { userInfo } =
    useSelector(
      (state) => state.user
    );

  const cartItems =
    useSelector(
      (state) => state.cart.items
    );

  const isAdmin =
    userInfo?.role === "admin" ||
    userInfo?.isAdmin === true;

  const isApproved =
    userInfo?.isApproved === true ||
    isAdmin;

  const canSeePricesAndCart =
    isApproved;

  const prodId =
    product._id ||
    product.id;

  const prodName =
    product.name ||
    product.nom ||
    "Monture Bayene";

  const prodPrice =
    product.price ??
    product.prix;

  const prodRef =
    product.ref ||
    product.reference ||
    "MODEL-EX";

  const prodImage =
    product.image ||
    "https://via.placeholder.com/1200";


  /* =====================================================
     PANIER
  ===================================================== */

  const handleAddToCart = async (event) => {
    event.stopPropagation();

    if (!canSeePricesAndCart) {
      navigate("/login");
      return;
    }

    try {
      const existingItem = cartItems.find(
        (item) =>
          String(item._id || item.id) ===
          String(prodId)
      );

      let nextItems;

      if (existingItem) {
        nextItems = cartItems.map(
          (item) =>
            String(item._id || item.id) ===
            String(prodId)
              ? {
                  ...item,
                  quantite:
                    Number(
                      item.quantite || 1
                    ) + 1,
                }
              : item
        );
      } else {
        nextItems = [
          ...cartItems,
          {
            id: prodId,
            name: prodName,
            price: Number(prodPrice),
            image: prodImage,
            ref: prodRef,
            quantite: 1,
          },
        ];
      }

      const response = await saveCart(
        nextItems.map((item) => ({
          productId:
            item._id || item.id,
          quantite: Number(
            item.quantite || 1
          ),
        }))
      );

      dispatch(
        addToCart({
          id: prodId,
          name: prodName,
          price: Number(prodPrice),
          image: prodImage,
          ref: prodRef,
          quantite: 1,
        })
      );

      console.log(
        "✅ Panier synchronisé :",
        response.data
      );

      setAdded(true);

      setTimeout(() => {
        setAdded(false);
      }, 2000);
    } catch (error) {
      console.error(
        "❌ Erreur ajout panier :",
        error.response?.data ||
          error.message
      );
    }
  };


  /* =====================================================
     DETAIL
  ===================================================== */

  const handleViewProduct = () => {
    navigate(`/product/${prodId}`);
  };

  return (
    <article
      onClick={handleViewProduct}
      onMouseEnter={() =>
        setIsHovered(true)
      }
      onMouseLeave={() =>
        setIsHovered(false)
      }
      className="
        group
        relative
        cursor-pointer
        w-full
      "
      style={{
        opacity: isLoaded ? 1 : 0,

        transform: isLoaded
          ? "translateY(0)"
          : "translateY(30px)",

        transition: `
          opacity 0.8s ease ${index * 90}ms,
          transform 0.8s ease ${index * 90}ms
        `,
      }}
    >
      <div
        className="
          relative
          w-full
          aspect-square
          overflow-hidden
          bg-[#F1EBE5]
        "
      >
        <img
          src={prodImage}
          alt={prodName}
          className="
            absolute
            inset-0
            w-full
            h-full
            object-contain
            p-4
            sm:p-6
            md:p-7
            lg:p-8
            transition-transform
            duration-1000
            ease-[cubic-bezier(0.22,1,0.36,1)]
            group-hover:scale-[1.06]
          "
          loading="lazy"
          decoding="async"
        />

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-br
            from-white/20
            via-transparent
            to-[#B99483]/10
            pointer-events-none
          "
        />

        <div
          className="
            absolute
            top-4
            left-4
            sm:top-5
            sm:left-5
            z-10
            text-[8px]
            sm:text-[9px]
            font-mono
            tracking-[0.2em]
            text-[#6F5D50]
          "
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        <button
          onClick={(event) => {
            event.stopPropagation();
            setLiked(!liked);
          }}
          className="
            absolute
            top-3
            right-3
            sm:top-4
            sm:right-4
            z-20
            w-9
            h-9
            sm:w-10
            sm:h-10
            rounded-full
            bg-white/80
            backdrop-blur-sm
            flex
            items-center
            justify-center
            transition-all
            duration-500
            hover:bg-white
            hover:scale-105
          "
        >
          <Heart
            size={16}
            strokeWidth={1.4}
            className={
              liked
                ? "text-[#B99483] fill-[#B99483]"
                : "text-[#40352E]"
            }
          />
        </button>

        {index === 0 && (
          <div
            className="
              absolute
              bottom-4
              left-4
              sm:bottom-5
              sm:left-5
              z-10
              px-3
              py-1.5
              bg-[#302822]
              text-white
              text-[7px]
              sm:text-[8px]
              uppercase
              tracking-[0.25em]
              font-mono
            "
          >
            Nouveau
          </div>
        )}

        <button
          onClick={(event) => {
            event.stopPropagation();
            handleViewProduct();
          }}
          className={`
            absolute
            bottom-4
            right-4
            sm:bottom-5
            sm:right-5
            z-20
            w-10
            h-10
            sm:w-11
            sm:h-11
            rounded-full
            bg-white
            flex
            items-center
            justify-center
            shadow-sm
            transition-all
            duration-500
            ${
              isHovered
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-3"
            }
          `}
        >
          <ArrowUpRight
            size={17}
            strokeWidth={1.4}
            className="
              text-[#302822]
              transition-transform
              duration-300
              group-hover:rotate-45
            "
          />
        </button>
      </div>

      <div
        className="
          pt-5
          sm:pt-6
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
            mb-2
          "
        >
          <span
            className="
              text-[7px]
              sm:text-[8px]
              font-mono
              uppercase
              tracking-[0.22em]
              text-[#9A8172]
            "
          >
            {prodRef}
          </span>

          <span
            className="
              w-5
              sm:w-7
              h-px
              bg-[#D4B8AE]
            "
          />
        </div>

        <h3
          className="
            font-serif
            font-light
            text-[17px]
            sm:text-xl
            lg:text-[22px]
            leading-tight
            text-[#302822]
            transition-colors
            duration-500
            group-hover:text-[#9C7665]
          "
        >
          {prodName}
        </h3>

        <div className="mt-3 min-h-[25px]">
          {canSeePricesAndCart ? (
            <div
              className="
                flex
                items-baseline
                gap-1.5
              "
            >
              <span
                className="
                  font-serif
                  text-base
                  sm:text-lg
                  text-[#302822]
                  font-light
                "
              >
                {prodPrice}
              </span>

              <span
                className="
                  text-[7px]
                  sm:text-[8px]
                  font-mono
                  tracking-widest
                  text-[#9A8172]
                "
              >
                EUR
              </span>
            </div>
          ) : (
            <div
              className="
                flex
                items-center
                gap-1.5
                text-[#9A8172]
              "
            >
              <Lock
                size={10}
                strokeWidth={1.4}
              />

              <span
                className="
                  text-[7px]
                  sm:text-[8px]
                  uppercase
                  tracking-[0.18em]
                  font-mono
                "
              >
                Prix réservé
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleAddToCart}
          className={`
            w-full
            min-h-[42px]
            sm:min-h-[46px]
            flex
            items-center
            justify-center
            gap-2
            text-[7px]
            sm:text-[8px]
            uppercase
            tracking-[0.2em]
            font-mono
            transition-all
            duration-500
            ${
              added
                ? "bg-[#B99483] text-white"
                : "bg-[#302822] text-white hover:bg-[#B99483]"
            }
          `}
        >
          {!canSeePricesAndCart ? (
            <>
              <Lock
                size={11}
                strokeWidth={1.4}
              />

              Connexion
            </>
          ) : added ? (
            <>
              <Check
                size={12}
                strokeWidth={1.4}
              />

              Ajouté
            </>
          ) : (
            <>
              <ShoppingBag
                size={12}
                strokeWidth={1.4}
              />

              Ajouter au panier
            </>
          )}
        </button>
      </div>
    </article>
  );
}


/* =========================================================
   PRODUCT DETAIL
========================================================= */

export function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [product, setProduct] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [added, setAdded] =
    useState(false);

  const { userInfo } =
    useSelector(
      (state) => state.user
    );

  const cartItems =
    useSelector(
      (state) => state.cart.items
    );

  const isAdmin =
    userInfo?.role === "admin" ||
    userInfo?.isAdmin === true;

  const isApproved =
    userInfo?.isApproved === true ||
    isAdmin;

  const canSeePricesAndCart =
    isApproved;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        const res =
          await getProductById(
            productId
          );

        const productData =
          res.data || res;

        if (productData) {
          setProduct(productData);
        }
      } catch (error) {
        console.error(
          "Erreur chargement produit :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);


  if (loading) {
    return (
      <div
        className="
          min-h-screen
          bg-[#FAF7F3]
          flex
          items-center
          justify-center
          text-[#302822]
        "
      >
        <p
          className="
            font-mono
            text-[9px]
            uppercase
            tracking-[0.4em]
            animate-pulse
          "
        >
          Ouverture de la fiche…
        </p>
      </div>
    );
  }


  if (!product) {
    return (
      <div
        className="
          min-h-screen
          bg-[#FAF7F3]
          flex
          items-center
          justify-center
          text-[#302822]
        "
      >
        <div
          className="
            text-center
            space-y-5
          "
        >
          <p
            className="
              font-serif
              text-4xl
            "
          >
            Produit introuvable.
          </p>

          <Link
            to="/collection"
            className="
              inline-block
              text-[#B99483]
              text-[9px]
              uppercase
              tracking-[0.3em]
              hover:underline
            "
          >
            Retour aux collections
          </Link>
        </div>
      </div>
    );
  }


  /* =====================================================
     PRODUCT DATA
  ===================================================== */

  const prodId =
    product._id ||
    product.id;

  const prodName =
    product.name ||
    product.nom ||
    "Monture Bayene";

  const prodPrice =
    product.price ??
    product.prix;

  const prodRef =
    product.ref ||
    product.reference ||
    "MODEL-EX";

  const prodDesc =
    product.description ||
    "Description non disponible.";

  const prodImage =
    product.image ||
    "https://via.placeholder.com/1200";


  /* =====================================================
     PANIER
  ===================================================== */

  const handleAddToCart = async (event) => {
    event.stopPropagation();

    if (!canSeePricesAndCart) {
      navigate("/login");
      return;
    }

    try {
      const existingItem = cartItems.find(
        (item) =>
          String(item._id || item.id) ===
          String(prodId)
      );

      let nextItems;

      if (existingItem) {
        nextItems = cartItems.map(
          (item) =>
            String(item._id || item.id) ===
            String(prodId)
              ? {
                  ...item,
                  quantite:
                    Number(
                      item.quantite || 1
                    ) + 1,
                }
              : item
        );
      } else {
        nextItems = [
          ...cartItems,
          {
            id: prodId,
            name: prodName,
            price: Number(prodPrice),
            image: prodImage,
            ref: prodRef,
            quantite: 1,
          },
        ];
      }

      const response = await saveCart(
        nextItems.map((item) => ({
          productId:
            item._id || item.id,
          quantite: Number(
            item.quantite || 1
          ),
        }))
      );

      dispatch(
        addToCart({
          id: prodId,
          name: prodName,
          price: Number(prodPrice),
          image: prodImage,
          ref: prodRef,
          quantite: 1,
        })
      );

      console.log(
        "✅ Produit ajouté au panier :",
        response.data
      );

      setAdded(true);

      setTimeout(() => {
        setAdded(false);
      }, 2000);
    } catch (error) {
      console.error(
        "❌ Erreur synchronisation panier :",
        error.response?.data ||
          error.message
      );
    }
  };


  return (
    <div
      className="
        relative
        min-h-screen
        bg-[#FAF7F3]
        text-[#302822]
        pt-28
        sm:pt-32
        pb-20
        px-4
        sm:px-8
        lg:px-16
        overflow-x-hidden
      "
    >
      <div
        className="
          fixed
          inset-0
          bg-cover
          bg-center
          opacity-[0.035]
          pointer-events-none
        "
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />

      <div
        className="
          relative
          z-10
          max-w-6xl
          mx-auto
        "
      >
        <button
          onClick={() =>
            navigate("/collection")
          }
          className="
            group
            inline-flex
            items-center
            gap-3
            text-[8px]
            sm:text-[9px]
            uppercase
            tracking-[0.4em]
            text-[#302822]
            transition-all
            duration-500
            hover:text-[#B99483]
          "
        >
          <ArrowLeft
            size={15}
            strokeWidth={1.5}
            className="
              transition-transform
              duration-300
              group-hover:-translate-x-1
            "
          />

          Retour aux collections
        </button>


        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-2
            gap-10
            lg:gap-20
            items-start
            mt-12
            sm:mt-16
          "
        >
          <div
            className="
              relative
              aspect-square
              bg-[#F1EBE5]
              overflow-hidden
            "
          >
            <img
              src={prodImage}
              alt={prodName}
              className="
                w-full
                h-full
                object-contain
                p-6
                sm:p-10
                lg:p-14
                transition-transform
                duration-[1200ms]
                hover:scale-[1.04]
              "
            />

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-br
                from-white/15
                via-transparent
                to-[#B99483]/10
                pointer-events-none
              "
            />

            <div
              className="
                absolute
                top-5
                left-5
                text-[8px]
                font-mono
                tracking-[0.25em]
                text-[#7B6658]
              "
            >
              {prodRef}
            </div>
          </div>


          <div
            className="
              space-y-8
              pt-2
              lg:pt-10
            "
          >
            <div className="space-y-4">
              <span
                className="
                  font-mono
                  text-[8px]
                  uppercase
                  tracking-[0.4em]
                  text-[#B99483]
                "
              >
                Référence : {prodRef}
              </span>

              <h1
                className="
                  font-serif
                  text-5xl
                  sm:text-6xl
                  lg:text-7xl
                  font-light
                  leading-[1.05]
                  text-[#302822]
                "
              >
                {prodName}
              </h1>

              {canSeePricesAndCart ? (
                <p
                  className="
                    text-3xl
                    sm:text-4xl
                    lg:text-5xl
                    font-serif
                    font-light
                    text-[#B99483]
                  "
                >
                  {prodPrice}

                  <span
                    className="
                      text-base
                      font-mono
                      ml-2
                    "
                  >
                    EUR
                  </span>
                </p>
              ) : (
                <p
                  className="
                    text-[9px]
                    font-mono
                    text-[#8B7355]
                    italic
                    flex
                    items-center
                    gap-2
                  "
                >
                  <Lock size={13} />

                  Prix réservé aux membres
                  approuvés
                </p>
              )}
            </div>

            <div
              className="
                w-full
                h-px
                bg-[#D4B8AE]/40
              "
            />

            <p
              className="
                font-light
                text-[#302822]/75
                leading-relaxed
                text-sm
                sm:text-base
                max-w-xl
              "
            >
              {prodDesc}
            </p>

            <button
              onClick={handleAddToCart}
              className={`
                w-full
                min-h-[56px]
                uppercase
                tracking-[0.3em]
                text-[9px]
                font-mono
                flex
                items-center
                justify-center
                gap-3
                transition-all
                duration-500
                hover:shadow-xl
                ${
                  !canSeePricesAndCart
                    ? "bg-[#302822] text-white hover:bg-[#B99483]"
                    : added
                    ? "bg-[#B99483] text-white"
                    : "bg-[#302822] text-white hover:bg-[#B99483]"
                }
              `}
            >
              {!canSeePricesAndCart ? (
                <>
                  <Lock size={15} />

                  Se connecter pour
                  débloquer
                </>
              ) : added ? (
                <>
                  <Check size={15} />

                  Ajouté au panier
                </>
              ) : (
                <>
                  <ShoppingBag size={15} />

                  Ajouter au panier
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}