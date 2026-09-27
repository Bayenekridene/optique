
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const token = localStorage.getItem('token');

  const loadOrders = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(response.data || []);
    } catch (error) {
      console.error(
        'Erreur commandes :',
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          'Impossible de charger les commandes.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF6F2',
        padding: '40px',
        paddingTop: '100px',
        color: '#3D3229',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* TITRE */}
        <h1
          style={{
            fontSize: '32px',
            marginBottom: '10px',
          }}
        >
          Gestion des commandes
        </h1>

        <p
          style={{
            color: '#8B7355',
            marginBottom: '30px',
          }}
        >
          Toutes les commandes de La Roselle Atelier
        </p>

        {/* BOUTONS */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '25px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono uppercase tracking-widest transition-colors"
          >
            ← Retour
          </button>

          <button
            onClick={loadOrders}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: '#9E6B6B',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            ↻ Rafraîchir
          </button>
        </div>

        {/* CONTENU */}
        {loading ? (
          <p>Chargement des commandes...</p>
        ) : orders.length === 0 ? (
          <div
            style={{
              padding: '30px',
              background: 'white',
              border: '1px solid #E8DDD3',
            }}
          >
            Aucune commande pour le moment.
          </div>
        ) : (
          <div
            style={{
              background: 'white',
              border: '1px solid #E8DDD3',
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#E8DDD3',
                    textAlign: 'left',
                  }}
                >
                  <th style={{ padding: '15px' }}>
                    Client
                  </th>

                  <th style={{ padding: '15px' }}>
                    Sous-total
                  </th>

                  <th style={{ padding: '15px' }}>
                    Livraison
                  </th>

                  <th style={{ padding: '15px' }}>
                    Total
                  </th>

                  <th style={{ padding: '15px' }}>
                    Paiement
                  </th>

                  <th style={{ padding: '15px' }}>
                    Date
                  </th>

                  <th style={{ padding: '15px' }}>
                    Détail
                  </th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    style={{
                      borderTop:
                        '1px solid #E8DDD3',
                    }}
                  >
                    <td style={{ padding: '15px' }}>
                      <strong>
                        {order.customerEmail ||
                          'Client'}
                      </strong>
                    </td>

                    <td style={{ padding: '15px' }}>
                      {Number(
                        order.subtotal || 0
                      ).toFixed(2)}{' '}
                      €
                    </td>

                    <td style={{ padding: '15px' }}>
                      {Number(
                        order.shipping || 0
                      ).toFixed(2)}{' '}
                      €
                    </td>

                    <td
                      style={{
                        padding: '15px',
                        fontWeight: 'bold',
                      }}
                    >
                      {Number(
                        order.total || 0
                      ).toFixed(2)}{' '}
                      €
                    </td>

                    <td style={{ padding: '15px' }}>
                      <span
                        style={{
                          color:
                            order.paymentStatus ===
                            'paid'
                              ? '#477A5B'
                              : '#9E6B6B',
                          fontWeight: 'bold',
                        }}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td style={{ padding: '15px' }}>
                      {order.createdAt
                        ? new Date(
                            order.createdAt
                          ).toLocaleDateString(
                            'fr-FR'
                          )
                        : '-'}
                    </td>

                    <td style={{ padding: '15px' }}>
                      <button
                        onClick={() =>
                          setSelectedOrder(order)
                        }
                        style={{
                          padding:
                            '8px 12px',
                          border: 'none',
                          background:
                            '#9E6B6B',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================= */}
      {/* FENÊTRE DÉTAIL COMMANDE */}
      {/* ========================= */}

      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#FCFAFA',
              color: '#3D3229',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '30px',
              border:
                '1px solid #9E6B6B',
            }}
          >
            {/* HEADER MODAL */}
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom: '25px',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '10px',
                    letterSpacing: '3px',
                    textTransform:
                      'uppercase',
                    color: '#9E6B6B',
                  }}
                >
                  La Roselle Atelier
                </p>

                <h2
                  style={{
                    fontSize: '26px',
                    fontFamily: 'serif',
                    fontWeight: '400',
                  }}
                >
                  Détail de la commande
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedOrder(null)
                }
                style={{
                  border: 'none',
                  background:
                    'transparent',
                  fontSize: '25px',
                  cursor: 'pointer',
                  color: '#3D3229',
                }}
              >
                ×
              </button>
            </div>

            {/* INFORMATIONS CLIENT */}
            <div
              style={{
                borderTop:
                  '1px solid #E8DDD3',
                borderBottom:
                  '1px solid #E8DDD3',
                padding: '18px 0',
                marginBottom: '20px',
              }}
            >
              <p>
                <strong>
                  Client :
                </strong>{' '}
                {selectedOrder.customerEmail ||
                  '-'}
              </p>

              <p>
                <strong>
                  Date :
                </strong>{' '}
                {selectedOrder.createdAt
                  ? new Date(
                      selectedOrder.createdAt
                    ).toLocaleString(
                      'fr-FR'
                    )
                  : '-'}
              </p>

              <p>
                <strong>
                  Statut :
                </strong>{' '}
                <span
                  style={{
                    color: '#477A5B',
                    fontWeight:
                      'bold',
                  }}
                >
                  {
                    selectedOrder.paymentStatus
                  }
                </span>
              </p>

              <p>
                <strong>
                  ID commande :
                </strong>{' '}
                {selectedOrder.id}
              </p>
            </div>

            {/* RÉSUMÉ */}
            <div
              style={{
                marginBottom: '20px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'serif',
                  fontSize: '20px',
                  marginBottom: '15px',
                }}
              >
                Résumé
              </h3>

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  marginBottom: '8px',
                }}
              >
                <span>
                  Sous-total
                </span>

                <strong>
                  {Number(
                    selectedOrder.subtotal ||
                      0
                  ).toFixed(2)}{' '}
                  €
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  marginBottom: '8px',
                }}
              >
                <span>
                  Livraison
                </span>

                <strong>
                  {Number(
                    selectedOrder.shipping ||
                      0
                  ).toFixed(2)}{' '}
                  €
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  borderTop:
                    '1px solid #E8DDD3',
                  paddingTop: '15px',
                  marginTop: '15px',
                  fontSize: '20px',
                }}
              >
                <strong>
                  Total
                </strong>

                <strong
                  style={{
                    color: '#9E6B6B',
                  }}
                >
                  {Number(
                    selectedOrder.total ||
                      0
                  ).toFixed(2)}{' '}
                  €
                </strong>
              </div>
            </div>

            {/* FERMER */}
            <button
              onClick={() =>
                setSelectedOrder(null)
              }
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                background:
                  '#9E6B6B',
                color: 'white',
                cursor: 'pointer',
                textTransform:
                  'uppercase',
                letterSpacing: '2px',
                fontSize: '11px',
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
