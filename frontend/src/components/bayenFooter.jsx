import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';
import LogoImg from '../assets/logo-bayene.png';

const Footer = () => {
  return (
    <footer className="relative bg-[#FAF6F4] border-t border-[#EEDDD8] font-sans text-neutral-800">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        
        {/* Contenu principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 items-start text-center md:text-left">
          
          {/* 1. Logo & Phrase d'accroche */}
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <Link to="/">
              <img 
                src={LogoImg} 
                alt="La Roselle Atelier" 
                className="h-10 md:h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-xs text-neutral-600 max-w-xs leading-relaxed font-light">
              <span className="hidden md:inline">L'expertise optique au service de l'élégance visuelle.</span>
              <span className="inline md:hidden">L'élégance visuelle par excellence.</span>
            </p>
          </div>

          {/* 2. Liens utiles */}
          <div className="space-y-4">
            <h4 className="text-xs font-serif uppercase tracking-[0.2em] text-[#9E6B6B] font-semibold">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs font-light text-neutral-700">
              <li>
                <Link to="/contact" className="hover:text-[#9E6B6B] transition-colors">Contact</Link>
              </li>
              <li>
                <Link to="/livraison" className="hover:text-[#9E6B6B] transition-colors">Livraison & Retours</Link>
              </li>
              <li>
                <Link to="/mentions" className="hover:text-[#9E6B6B] transition-colors">Mentions Légales</Link>
              </li>
            </ul>
          </div>

          {/* 3. Contact & Réseaux */}
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <h4 className="text-xs font-serif uppercase tracking-[0.2em] text-[#9E6B6B] font-semibold">
              Atelier & Contact
            </h4>
            <div className="space-y-2.5 text-xs font-light text-neutral-600">
              <p className="flex items-center justify-center md:justify-start gap-2">
                <MapPin size={14} className="text-[#9E6B6B] shrink-0" /> 12 Rue de la Paix, Paris
              </p>
              <p className="flex items-center justify-center md:justify-start gap-2">
                <Phone size={14} className="text-[#9E6B6B] shrink-0" /> +33 1 23 45 67 89
              </p>
            </div>

            {/* Réseaux Sociaux */}
            <div className="flex gap-3 pt-2">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ borderRadius: '0px' }}
                className="w-8 h-8 rounded-none bg-white border border-[#EEDDD8] flex items-center justify-center text-[#9E6B6B] hover:bg-[#9E6B6B] hover:text-white transition-all shadow-sm cursor-pointer"
                aria-label="Instagram"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ borderRadius: '0px' }}
                className="w-8 h-8 rounded-none bg-white border border-[#EEDDD8] flex items-center justify-center text-[#9E6B6B] hover:bg-[#9E6B6B] hover:text-white transition-all shadow-sm cursor-pointer"
                aria-label="Facebook"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.37 14.5 5 15.5 5H18V0h-3.808C10.59 0 9 1.581 9 4.615V8z"/>
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-[#EEDDD8] text-center text-[10px] uppercase tracking-widest text-neutral-500">
          © {new Date().getFullYear()} La Roselle Atelier. Tous droits réservés.
        </div>

      </div>
    </footer>
  );
};

export default Footer;