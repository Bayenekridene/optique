import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../features/userSlice'; // ← CORRECTION ICI
import { Mail, Lock, LogIn, User, UserPlus } from 'lucide-react';
import logoLaRoselle from '../assets/logo-bayene1.png';
import logoBayene from '../assets/logo-bayene.png';
import backgroundImage from '../assets/bg-bayene.jpg';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status } = useSelector((state) => state.user);
  const isLoading = status === 'loading';

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showAlert, setShowAlert] = useState(null); // Pour les alertes personnalisées

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password || (isSignup && !formData.name)) {
      setShowAlert({ type: 'error', message: 'Veuillez remplir tous les champs.' });
      return;
    }

    try {
      if (isSignup) {
        // Inscription gérée proprement par Redux
        const resultAction = await dispatch(
          register({
            nom: formData.name,
            email: formData.email,
            password: formData.password,
          })
        );

        if (register.fulfilled.match(resultAction)) {
          setShowAlert({ 
            type: 'success', 
            message: "Inscription réussie ! Votre compte est en attente d'approbation par un administrateur." 
          });
          setIsSignup(false);
          setFormData({ name: '', email: '', password: '' });
          navigate('/collection');
        } else {
          setShowAlert({ type: 'error', message: resultAction.payload || "Erreur lors de l'inscription." });
        }
      } else {
        // Connexion gérée par Redux
        const resultAction = await dispatch(
          login({
            email: formData.email,
            password: formData.password,
          })
        );

        if (login.fulfilled.match(resultAction)) {
          const userData = resultAction.payload;
          
          if (userData.isAdmin) {
            navigate('/admin');
          } else if (!userData.isApproved) {
            setShowAlert({ 
              type: 'info', 
              message: "Votre compte est en attente d'approbation par l'administrateur pour accéder aux prix et au panier." 
            });
            navigate('/collection');
          } else {
            navigate('/collection');
          }
        } else {
          setShowAlert({ type: 'error', message: resultAction.payload || "Identifiants incorrects." });
        }
      }
    } catch (err) {
      console.error("Erreur :", err);
      setShowAlert({ type: 'error', message: "Une erreur est survenue. Veuillez réessayer." });
    }
  };

  // Fermer l'alerte automatiquement après 5 secondes
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  return (
    <div className="relative min-h-screen pt-32 pb-24 px-6 sm:px-10 lg:px-16 flex items-center justify-center overflow-hidden bg-black">
      
      {/* Image de fond */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          opacity: 0.45
        }}
      />

      <div className="absolute inset-0 bg-black/5 z-0 pointer-events-none" />

      {/* Alertes personnalisées */}
      {showAlert && (
        <div className="fixed top-24 right-4 z-50 max-w-md w-full">
          <div className={`p-4 border-l-4 shadow-lg rounded-none ${
            showAlert.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
            showAlert.type === 'info' ? 'bg-blue-50 border-blue-500 text-blue-800' :
            showAlert.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
            'bg-gray-50 border-gray-500 text-gray-800'
          }`}>
            <p className="text-sm font-medium">{showAlert.message}</p>
          </div>
        </div>
      )}

      <div 
        className={`relative z-10 max-w-4xl w-full mx-auto space-y-16 transition-all duration-1000 ease-out transform ${
          isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
      >
        
        {/* En-tête Logos */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            <div className="bg-[#FCFAFA] backdrop-blur-md p-6 sm:p-8 border border-[#9E6B6B]/40 shadow-2xl transition-transform duration-300 hover:scale-105 w-64 sm:w-72 h-36 flex items-center justify-center rounded-none">
              <img src={logoLaRoselle} alt="La Roselle Atelier" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="bg-[#FCFAFA] backdrop-blur-md p-6 sm:p-8 border border-[#9E6B6B]/40 shadow-2xl transition-transform duration-300 hover:scale-105 w-64 sm:w-72 h-36 flex items-center justify-center rounded-none">
              <img src={logoBayene} alt="Bayene Eyewear" className="max-h-full max-w-full object-contain" />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#9E6B6B]">
              Bayene Eyewear & La Roselle Atelier
            </span>
            <h1 className="text-4xl sm:text-6xl font-serif text-white font-light tracking-wide">
              {isSignup ? "Inscription" : "Connexion"}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
              {isSignup ? "Créez votre compte pour soumettre votre accès." : "Accédez à votre espace personnel et vos commandes."}
            </p>
          </div>
          <div className="w-16 h-[1px] bg-[#9E6B6B] mx-auto" />
        </div>

        {/* Formulaire */}
        <div className="max-w-xl mx-auto bg-[#FCFAFA] backdrop-blur-md border border-[#9E6B6B]/30 p-8 sm:p-12 shadow-2xl relative rounded-none text-neutral-900">
          
          <h2 className="text-2xl font-serif text-neutral-900 font-light mb-6">
            {isSignup ? "Créer un compte" : "Identifiez-vous"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Champ Nom (si inscription) */}
            {isSignup && (
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest block">
                  Nom complet
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#9E6B6B]">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    name="name"
                    required={isSignup}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Votre nom"
                    style={{ borderRadius: '0px' }}
                    disabled={isLoading}
                    className="w-full bg-white border border-[#9E6B6B]/30 pl-11 pr-4 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#9E6B6B] transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* Champ Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest block">
                Adresse Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#9E6B6B]">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="exemple@domain.com"
                  style={{ borderRadius: '0px' }}
                  disabled={isLoading}
                  className="w-full bg-white border border-[#9E6B6B]/30 pl-11 pr-4 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#9E6B6B] transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest block">
                Mot de passe
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#9E6B6B]">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{ borderRadius: '0px' }}
                  disabled={isLoading}
                  className="w-full bg-white border border-[#9E6B6B]/30 pl-11 pr-4 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#9E6B6B] transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Bouton Soumettre */}
            <button
              type="submit"
              style={{ borderRadius: '0px' }}
              disabled={isLoading}
              className="w-full py-4 text-xs font-medium uppercase tracking-widest text-white bg-[#9E6B6B] hover:bg-[#8A5A5A] border border-[#9E6B6B]/60 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#9E6B6B]/20 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                'Chargement...'
              ) : isSignup ? (
                <><UserPlus size={15} /> S'inscrire</>
              ) : (
                <><LogIn size={15} /> Se Connecter</>
              )}
            </button>
          </form>

          {/* Bascule Connexion / Inscription */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setShowAlert(null);
                setFormData({ name: '', email: '', password: '' });
              }}
              className="text-xs text-[#9E6B6B] hover:underline bg-transparent border-none cursor-pointer font-mono"
            >
              {isSignup ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
            </button>
          </div>

          {/* Indication test admin */}
          {!isSignup && (
            <div className="mt-8 pt-6 border-t border-[#9E6B6B]/20 text-center">
              <p className="text-[11px] font-light text-neutral-600">
                Pour tester le panneau <span className="text-[#9E6B6B] font-medium">Admin</span>, utilisez un email contenant le mot <code className="bg-[#f2e6e6] px-1.5 py-0.5 text-neutral-800 border border-[#9E6B6B]/30 rounded-none" style={{ borderRadius: '0px' }}>admin</code>.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}