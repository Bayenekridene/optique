
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login, logout } from '../features/userSlice';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

import adminBg from '../assets/admin-bg.png';

export default function AdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    try {
      setLoading(true);

      const user = await dispatch(
        login({
          email: cleanEmail,
          password,
        })
      ).unwrap();

      // Vérification ADMIN
      if (
        user.role !== 'admin' &&
        user.isAdmin !== true
      ) {
        dispatch(logout());

        setError(
          "Accès refusé. Cette connexion est réservée à l'administrateur."
        );

        return;
      }

      // Admin accepté
      navigate('/admin', { replace: true });

    } catch (err) {
      console.error('❌ Erreur connexion admin:', err);

      setError(
        typeof err === 'string'
          ? err
          : 'Email ou mot de passe incorrect.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-5 py-20"
      style={{
        backgroundImage: `
          linear-gradient(
            rgba(10, 8, 7, 0.35),
            rgba(10, 8, 7, 0.65)
          ),
          url(${adminBg})
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative z-10 w-full max-w-md">

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-4">
            <span className="w-10 h-px bg-[#E8DDD3]/70" />

            <span className="text-[10px] uppercase tracking-[0.45em] text-[#FAF6F2]">
              Administration
            </span>

            <span className="w-10 h-px bg-[#E8DDD3]/70" />
          </div>
        </div>

        <div className="
          bg-black/55
          backdrop-blur-xl
          border
          border-[#E8DDD3]/25
          shadow-2xl
          px-7
          sm:px-10
          py-10
        ">

          <div className="text-center mb-9">

            <p className="text-[#D4B8AE] text-[9px] uppercase tracking-[0.4em] mb-4">
              Espace sécurisé
            </p>

            <h1 className="text-4xl sm:text-5xl font-serif font-light text-[#FAF6F2]">
              Connexion
            </h1>

            <p className="text-sm text-[#E8DDD3]/60 mt-4">
              Accédez à votre espace administrateur.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-[#E8DDD3]/70 mb-2">
                Email administrateur
              </label>

              <div className="relative">

                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4B8AE]/70"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  autoComplete="username"
                  className="
                    w-full
                    bg-white/5
                    border
                    border-[#D4B8AE]/25
                    text-[#FAF6F2]
                    placeholder:text-white/30
                    pl-12
                    pr-4
                    py-4
                    outline-none
                    focus:border-[#D4B8AE]/70
                    transition-all
                  "
                />

              </div>
            </div>

            <div>

              <label className="block text-[10px] uppercase tracking-[0.25em] text-[#E8DDD3]/70 mb-2">
                Mot de passe
              </label>

              <div className="relative">

                <Lock
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4B8AE]/70"
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  className="
                    w-full
                    bg-white/5
                    border
                    border-[#D4B8AE]/25
                    text-[#FAF6F2]
                    placeholder:text-white/30
                    pl-12
                    pr-12
                    py-4
                    outline-none
                    focus:border-[#D4B8AE]/70
                    transition-all
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-[#D4B8AE]/70
                    hover:text-[#FAF6F2]
                    transition-colors
                  "
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>
            </div>

            {error && (
              <div className="
                border
                border-red-400/30
                bg-red-950/30
                px-4
                py-3
              ">
                <p className="text-red-300 text-xs text-center">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                flex
                items-center
                justify-center
                gap-3
                bg-[#D4B8AE]
                hover:bg-[#E8DDD3]
                text-[#3D3229]
                py-4
                text-xs
                uppercase
                tracking-[0.3em]
                font-medium
                transition-all
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {loading ? (
                'Connexion...'
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={16} />
                </>
              )}
            </button>

          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="
              text-[9px]
              uppercase
              tracking-[0.25em]
              text-[#E8DDD3]/40
            ">
              Accès strictement réservé à l'administration
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

