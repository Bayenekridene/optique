import React, { useState, useEffect } from 'react';
import { Mail, Phone, Globe, Send, Check } from 'lucide-react';
import { sendContactMessage } from '../services/api'; // Import de l'API de contact
import logoLaRoselle from '../assets/logo-bayene1.png';
import logoBayene from '../assets/logo-bayene.png';
import backgroundImage from '../assets/bg-bayene.jpg'; 

export default function ContactSection() {
  const [formStatus, setFormStatus] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      // Envoi des données vers le backend MongoDB
      await sendContactMessage(formData);

      setFormStatus(true);
      setTimeout(() => {
        setFormStatus(false);
        setFormData({ name: '', email: '', phone: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
      alert("Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer.");
    }
  };

  return (
    <div className="relative min-h-screen pt-32 pb-24 px-6 sm:px-10 lg:px-16 flex items-center justify-center overflow-hidden bg-black">
      
      {/* Image de fond globale avec l'effet initial */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          opacity: 0.5
        }}
      />

      {/* Voile sombre global */}
      <div className="absolute inset-0 bg-black/5 z-0 pointer-events-none" />

      {/* Contenu principal */}
      <div 
        className={`relative z-10 max-w-6xl w-full mx-auto space-y-16 transition-all duration-1000 ease-out transform ${
          isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
      >
        
        {/* En-tête : Les deux logos */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            
            <div className="bg-[#FCFAFA] backdrop-blur-md p-6 sm:p-8 border border-[#9E6B6B]/40 shadow-2xl transition-transform duration-300 hover:scale-105 w-64 sm:w-72 h-36 flex items-center justify-center rounded-none">
              <img 
                src={logoLaRoselle} 
                alt="La Roselle Atelier" 
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="bg-[#FCFAFA] backdrop-blur-md p-6 sm:p-8 border border-[#9E6B6B]/40 shadow-2xl transition-transform duration-300 hover:scale-105 w-64 sm:w-72 h-36 flex items-center justify-center rounded-none">
              <img 
                src={logoBayene} 
                alt="Bayene Eyewear" 
                className="max-h-full max-w-full object-contain"
              />
            </div>

          </div>

          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#9E6B6B]">
              Bayene Eyewear & La Roselle Atelier
            </span>
            <h1 className="text-4xl sm:text-6xl font-serif text-white font-light tracking-wide">
              Contactez-nous
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
              Fabrication et distribution des lunettes, matériels et outillages optiques.
            </p>
          </div>
          <div className="w-16 h-[1px] bg-[#9E6B6B] mx-auto" />
        </div>

        {/* Grille : Coordonnées & Formulaire */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Bloc Coordonnées */}
          <div className="lg:col-span-5 bg-[#FCFAFA] backdrop-blur-md p-8 sm:p-10 border border-[#9E6B6B]/30 space-y-8 shadow-2xl relative overflow-hidden rounded-none text-neutral-900">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#9E6B6B]/10 blur-3xl pointer-events-none" />

            <h2 className="text-2xl font-serif text-neutral-900 font-light">
              Nos Coordonnées
            </h2>
            
            <div className="space-y-6 text-sm text-neutral-700">
              <div className="flex items-start gap-4 group">
                <div className="p-3 bg-[#9E6B6B]/15 text-[#9E6B6B] group-hover:bg-[#9E6B6B] group-hover:text-white transition-all duration-300 border border-[#9E6B6B]/30 rounded-none">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="font-medium text-neutral-900 text-xs uppercase tracking-wider mb-1">Téléphone</p>
                  <p className="font-light text-neutral-700 tracking-wider">0667790205</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="p-3 bg-[#9E6B6B]/15 text-[#9E6B6B] group-hover:bg-[#9E6B6B] group-hover:text-white transition-all duration-300 border border-[#9E6B6B]/30 rounded-none">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="font-medium text-neutral-900 text-xs uppercase tracking-wider mb-1">Email</p>
                  <p className="font-light text-neutral-700">contact@bayeneeyewear.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="p-3 bg-[#9E6B6B]/15 text-[#9E6B6B] group-hover:bg-[#9E6B6B] group-hover:text-white transition-all duration-300 border border-[#9E6B6B]/30 rounded-none">
                  <Globe size={18} />
                </div>
                <div>
                  <p className="font-medium text-neutral-900 text-xs uppercase tracking-wider mb-1">Site Web</p>
                  <p className="font-light text-neutral-700">www.bayeneeyewear.com</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#9E6B6B]/20">
              <p className="text-[11px] font-serif italic text-[#9E6B6B] text-center">
                « L'excellence et la précision au service de votre regard. »
              </p>
            </div>
          </div>

          {/* Formulaire de Contact */}
          <div className="lg:col-span-7 bg-[#FCFAFA] backdrop-blur-md border border-[#9E6B6B]/30 p-8 sm:p-12 shadow-2xl relative rounded-none text-neutral-900">
            <h2 className="text-2xl font-serif text-neutral-900 font-light mb-6">
              Envoyez-nous un message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest block">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Votre nom"
                    className="w-full bg-white border border-[#9E6B6B]/30 px-4 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#9E6B6B] transition-colors rounded-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest block">
                    Adresse Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contact@bayeneeyewear.com"
                    className="w-full bg-white border border-[#9E6B6B]/30 px-4 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#9E6B6B] transition-colors rounded-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest block">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0667790205"
                  className="w-full bg-white border border-[#9E6B6B]/30 px-4 py-3 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#9E6B6B] transition-colors rounded-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest block">
                  Votre Message
                </label>
                <textarea
                  name="message"
                  required
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Comment pouvons-nous vous accompagner ?"
                  className="w-full bg-white border border-[#9E6B6B]/30 p-4 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#9E6B6B] transition-colors resize-none rounded-none"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-4 text-xs font-medium uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer rounded-none border border-[#9E6B6B]/40 ${
                  formStatus
                    ? 'bg-[#7A9A82] text-white border-[#7A9A82]'
                    : 'bg-[#9E6B6B] hover:bg-[#8A5A5A] text-white shadow-lg shadow-[#9E6B6B]/20'
                }`}
              >
                {formStatus ? (
                  <>
                    <Check size={16} /> Message envoyé avec succès
                  </>
                ) : (
                  <>
                    <Send size={15} /> Envoyer le message
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}