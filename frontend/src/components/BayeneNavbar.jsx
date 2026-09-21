import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  User,
  ShoppingBag,
  Menu,
  X,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import bayeneLogo from '../assets/logo-bayene.png';
import { logout } from '../features/userSlice';
import SearchModal from './SearchModal'; // ← Import du SearchModal

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Récupération des infos utilisateur
  const { userInfo } = useSelector((state) => state.user);
  const { totalItems } = useSelector((state) => state.cart);
  
  const isAuthenticated = !!userInfo;
  const isApproved = userInfo?.isApproved === true || userInfo?.role === 'admin';
  const isAdmin = userInfo?.role === 'admin' || userInfo?.isAdmin === true;

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleToggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
  };

  // Gestion du clic sur le panier
  const handleCartClick = (e) => {
    e.preventDefault();
    if (isAuthenticated && isApproved) {
      navigate('/cart');
    } else {
      navigate('/login');
    }
  };

  // Gestion de la déconnexion
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest('nav') && !e.target.closest('.menu-button')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: "Accueil", path: "/" },
    { name: "Collection", path: "/collection" },
    { name: "Contact", path: "/contact" }
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-md transition-all duration-300">
        <div className={`transition-all duration-300 ${scrolled ? 'shadow-sm bg-white/95' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-[70px] lg:h-[90px] gap-2">
              
              {/* GAUCHE : Logo */}
              <div className="flex items-center flex-shrink-0">
                <Link to="/" className="transition-transform duration-300 hover:scale-105">
                  <img
                    src={bayeneLogo}
                    alt="Bayene Eyewear"
                    className={`w-auto object-contain transition-all duration-300 ${
                      scrolled
                        ? 'h-[40px] sm:h-[50px] lg:h-[60px]'
                        : 'h-[48px] sm:h-[60px] lg:h-[75px]'
                    }`}
                  />
                </Link>
              </div>

              {/* DROITE : Liens et icônes */}
              <div className="flex items-center gap-3 sm:gap-6 lg:gap-10">
                {/* Liens Desktop */}
                <div className="hidden lg:flex items-center gap-10">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      end={link.path === "/"}
                      className={({ isActive }) =>
                        `font-serif italic tracking-wide transition-all duration-300 relative py-1 inline-block
                        ${isActive
                          ? 'text-[#9E6B6B] text-xl scale-110 font-medium after:w-full'
                          : 'text-[#2C2C2C] text-lg font-normal hover:text-[#9E6B6B] hover:scale-110 after:w-0 hover:after:w-full'}
                        after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:bg-[#9E6B6B] after:transition-all after:duration-300`
                      }
                    >
                      {link.name}
                    </NavLink>
                  ))}
                </div>

                {/* Icône Recherche */}
                <button
                  onClick={handleToggleSearch}
                  className="text-[#2C2C2C] hover:text-[#9E6B6B] hover:scale-110 transition-all duration-300 p-1 cursor-pointer"
                  aria-label="Recherche"
                  title="Rechercher"
                >
                  <Search size={20} strokeWidth={1.5} />
                </button>

                {/* Icône Panier (visible UNIQUEMENT si connecté ET approuvé) */}
                {isAuthenticated && isApproved && (
                  <button
                    onClick={handleCartClick}
                    className="text-[#2C2C2C] hover:text-[#9E6B6B] hover:scale-110 transition-all duration-300 p-1 cursor-pointer relative"
                    aria-label="Panier"
                    title="Panier"
                  >
                    <ShoppingBag size={20} strokeWidth={1.5} />
                    
                    {/* Badge avec le nombre d'articles */}
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#9E6B6B] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </button>
                )}

                {/* Compte Utilisateur / Déconnexion */}
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <span className="hidden lg:block text-[#2C2C2C] font-medium">
                      {userInfo?.name || userInfo?.email.split('@')[0]}
                    </span>
                    
                    <button
                      onClick={handleLogout}
                      className="text-[#2C2C2C] hover:text-[#9E6B6B] hover:scale-110 transition-all duration-300 p-1 cursor-pointer"
                      aria-label="Déconnexion"
                      title="Déconnexion"
                    >
                      <LogOut size={20} strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="text-[#2C2C2C] hover:text-[#9E6B6B] hover:scale-110 transition-all duration-300 p-1"
                    aria-label="Connexion"
                  >
                    <User size={20} strokeWidth={1.5} />
                  </Link>
                )}

                {/* Admin (si connecté et admin) */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-[#2C2C2C] hover:text-[#9E6B6B] hover:scale-110 transition-all duration-300 hidden lg:block p-1"
                    aria-label="Administration"
                    title="Administration"
                  >
                    <ShieldCheck size={22} strokeWidth={1.5} />
                  </Link>
                )}

                {/* Menu Burger Mobile */}
                <div className="lg:hidden flex items-center">
                  <button
                    onClick={toggleMenu}
                    className="menu-button text-[#2C2C2C] hover:text-[#9E6B6B] focus:outline-none p-1 transition-colors cursor-pointer"
                    aria-label="Menu"
                  >
                    {isOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Mobile */}
          {isOpen && (
            <div className="lg:hidden bg-white/95 backdrop-blur-md border-t border-neutral-200 shadow-lg">
              <div className="px-6 py-4 space-y-4">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.path === "/"}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `block py-3 font-serif italic text-lg transition-colors ${
                        isActive ? 'text-[#9E6B6B]' : 'text-[#2C2C2C]'
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                ))}
                
                {/* Bouton Recherche Mobile */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleToggleSearch();
                  }}
                  className="flex items-center gap-3 w-full py-3 text-[#2C2C2C] hover:text-[#9E6B6B] transition-colors cursor-pointer"
                >
                  <Search size={20} />
                  <span className="font-serif italic text-lg">Rechercher</span>
                </button>

                {/* Panier Mobile (visible si connecté et approuvé) */}
                {isAuthenticated && isApproved && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/cart');
                    }}
                    className="flex items-center gap-3 w-full py-3 text-[#2C2C2C] hover:text-[#9E6B6B] transition-colors cursor-pointer"
                  >
                    <ShoppingBag size={20} />
                    <span className="font-serif italic text-lg">Panier</span>
                    {totalItems > 0 && (
                      <span className="ml-auto bg-[#9E6B6B] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </button>
                )}

                {/* Connexion / Déconnexion */}
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 w-full py-3 text-[#2C2C2C] hover:text-[#9E6B6B] transition-colors cursor-pointer"
                  >
                    <LogOut size={20} />
                    <span className="font-serif italic text-lg">Déconnexion</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 w-full py-3 text-[#2C2C2C] hover:text-[#9E6B6B] transition-colors"
                  >
                    <User size={20} />
                    <span className="font-serif italic text-lg">Connexion</span>
                  </Link>
                )}

                {/* Admin Mobile */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 w-full py-3 text-[#2C2C2C] hover:text-[#9E6B6B] transition-colors"
                  >
                    <ShieldCheck size={20} />
                    <span className="font-serif italic text-lg">Administration</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Modal de Recherche */}
      <SearchModal isOpen={isSearchOpen} onClose={handleToggleSearch} />
    </>
  );
};

export default Navbar;