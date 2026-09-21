import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Users,
  CheckCircle,
  ShieldAlert,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/userSlice';
import { useNavigate } from 'react-router-dom';

const API_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Récupération de l'utilisateur connecté ET de son token
  const { userInfo } = useSelector((state) => state.user);

  /*
   * Récupérer tous les utilisateurs
   * Le token JWT est envoyé au backend.
   */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userInfo?.token) {
        setError("Session administrateur invalide. Veuillez vous reconnecter.");
        return;
      }

      const response = await axios.get(
        `${API_URL}/users/users`,
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      setUsers(response.data);
    } catch (err) {
      console.error(
        'Erreur récupération utilisateurs:',
        err.response?.data || err.message
      );

      if (err.response?.status === 401 || err.response?.status === 403) {
        setError(
          "Accès refusé. Votre session administrateur est invalide ou expirée."
        );
      } else {
        setError(
          "Erreur lors de la récupération des utilisateurs."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /*
   * Approuver un utilisateur
   */
  const handleApprove = async (id) => {
    try {
      setApproving(id);

      if (!userInfo?.token) {
        alert(
          "Session administrateur invalide. Veuillez vous reconnecter."
        );
        return;
      }

      await axios.put(
        `${API_URL}/users/approve/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      // Mise à jour immédiate de l'affichage
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === id
            ? { ...user, isApproved: true }
            : user
        )
      );

      // Recharge les utilisateurs depuis le serveur
      await fetchUsers();

    } catch (err) {
      console.error(
        "Erreur approbation:",
        err.response?.data || err.message
      );

      if (err.response?.status === 401) {
        alert(
          "Votre session a expiré. Veuillez vous reconnecter."
        );
      } else if (err.response?.status === 403) {
        alert(
          "Accès refusé : cette action est réservée à l'administrateur."
        );
      } else {
        alert(
          "Erreur lors de l'approbation de l'utilisateur."
        );
      }
    } finally {
      setApproving(null);
    }
  };

  /*
   * Déconnexion
   */
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-6 sm:px-10">

      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#9E6B6B]/30 pb-6">

          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#9E6B6B]">
              Administration
            </span>

            <h1 className="text-3xl font-serif font-light">
              Tableau de bord Admin
            </h1>
          </div>

          <div className="flex items-center gap-4">

            {/* Rafraîchir */}
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loading ? 'animate-spin' : ''}
              />
              Rafraîchir
            </button>

            {/* Déconnexion */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-[#9E6B6B] hover:bg-[#8A5A5A] text-white text-xs font-mono uppercase tracking-widest transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Déconnexion
            </button>

          </div>
        </div>

        {/* STATISTIQUES */}
        {!loading && !error && (

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* TOTAL */}
            <div className="bg-[#FCFAFA] text-neutral-900 border border-[#9E6B6B]/30 p-4">

              <p className="text-xs font-mono uppercase tracking-widest text-neutral-600">
                Total Utilisateurs
              </p>

              <p className="text-3xl font-serif text-[#9E6B6B]">
                {users.length}
              </p>

            </div>

            {/* EN ATTENTE */}
            <div className="bg-[#FCFAFA] text-neutral-900 border border-[#9E6B6B]/30 p-4">

              <p className="text-xs font-mono uppercase tracking-widest text-neutral-600">
                En attente
              </p>

              <p className="text-3xl font-serif text-amber-700">
                {
                  users.filter(
                    (user) =>
                      !user.isApproved &&
                      user.role !== 'admin'
                  ).length
                }
              </p>

            </div>

            {/* APPROUVÉS */}
            <div className="bg-[#FCFAFA] text-neutral-900 border border-[#9E6B6B]/30 p-4">

              <p className="text-xs font-mono uppercase tracking-widest text-neutral-600">
                Approuvés
              </p>

              <p className="text-3xl font-serif text-green-700">
                {
                  users.filter(
                    (user) =>
                      user.isApproved ||
                      user.role === 'admin'
                  ).length
                }
              </p>

            </div>

          </div>
        )}

        {/* CHARGEMENT */}
        {loading && (

          <p className="text-center text-neutral-400 font-mono text-xs">
            Chargement des utilisateurs...
          </p>

        )}

        {/* ERREUR */}
        {!loading && error && (

          <div className="text-center space-y-4">

            <p className="text-red-400 font-mono text-xs">
              {error}
            </p>

            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-[#9E6B6B] hover:bg-[#8A5A5A] text-white text-xs font-mono uppercase tracking-widest"
            >
              Réessayer
            </button>

          </div>

        )}

        {/* AUCUN UTILISATEUR */}
        {!loading && !error && users.length === 0 && (

          <p className="text-center text-neutral-400 font-mono text-xs">
            Aucun utilisateur inscrit.
          </p>

        )}

        {/* TABLEAU */}
        {!loading && !error && users.length > 0 && (

          <div className="bg-[#FCFAFA] text-neutral-900 border border-[#9E6B6B]/30 p-6 shadow-2xl">

            <h2 className="text-xl font-serif mb-4 flex items-center gap-2">
              <Users
                size={20}
                className="text-[#9E6B6B]"
              />

              Liste des utilisateurs inscrits
            </h2>

            <div className="overflow-x-auto">

              <table className="w-full text-left border-collapse">

                <thead>

                  <tr className="border-b border-[#9E6B6B]/20 text-[10px] font-mono uppercase text-neutral-600 tracking-wider">

                    <th className="py-3 px-4">
                      Nom
                    </th>

                    <th className="py-3 px-4">
                      Email
                    </th>

                    <th className="py-3 px-4">
                      Rôle
                    </th>

                    <th className="py-3 px-4">
                      Statut
                    </th>

                    <th className="py-3 px-4 text-center">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-[#9E6B6B]/10 text-sm">

                  {users.map((user) => (

                    <tr
                      key={user._id}
                      className="hover:bg-neutral-100 transition-colors"
                    >

                      {/* NOM */}
                      <td className="py-3 px-4 font-medium">
                        {user.nom || 'N/A'}
                      </td>

                      {/* EMAIL */}
                      <td className="py-3 px-4 text-neutral-600">
                        {user.email}
                      </td>

                      {/* RÔLE */}
                      <td className="py-3 px-4 font-mono text-xs">

                        <span
                          className={`px-2 py-1 ${
                            user.role === 'admin'
                              ? 'bg-[#9E6B6B] text-white'
                              : 'bg-neutral-200 text-neutral-800'
                          }`}
                        >
                          {user.role || 'client'}
                        </span>

                      </td>

                      {/* STATUT */}
                      <td className="py-3 px-4">

                        {user.isApproved ||
                        user.role === 'admin' ? (

                          <span className="text-green-700 flex items-center gap-1 text-xs font-mono">
                            <CheckCircle size={14} />
                            Approuvé
                          </span>

                        ) : (

                          <span className="text-amber-700 flex items-center gap-1 text-xs font-mono">
                            <ShieldAlert size={14} />
                            En attente
                          </span>

                        )}

                      </td>

                      {/* ACTION */}
                      <td className="py-3 px-4 text-center">

                        {!user.isApproved &&
                        user.role !== 'admin' && (

                          <button
                            onClick={() =>
                              handleApprove(user._id)
                            }
                            disabled={
                              approving === user._id
                            }
                            className={`px-3 py-1.5 text-white text-xs font-mono uppercase tracking-wider transition-colors ${
                              approving === user._id
                                ? 'bg-neutral-400 cursor-not-allowed'
                                : 'bg-[#9E6B6B] hover:bg-[#8A5A5A] cursor-pointer'
                            }`}
                          >
                            {approving === user._id
                              ? 'Traitement...'
                              : 'Approuver'}
                          </button>

                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}