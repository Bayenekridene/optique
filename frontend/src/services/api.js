import axios from 'axios';

// Backend local pendant le développement
// En production, REACT_APP_API_URL doit pointer vers Render.
const API_URL =
  process.env.REACT_APP_API_URL ||
  'http://localhost:5000/api';

const API = axios.create({
  baseURL: API_URL,
});

// Ajouter automatiquement le JWT aux requêtes protégées
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =========================
// PRODUITS
// =========================

export const getProducts = () =>
  API.get('/products');

export const getProductById = (id) =>
  API.get(`/products/${id}`);

export const createProduct = (productData) =>
  API.post('/products', productData);

export const updateProductAPI = (id, productData) =>
  API.put(`/products/${id}`, productData);

export const deleteProductAPI = (id) =>
  API.delete(`/products/${id}`);


// =========================
// PANIER
// =========================

export const getCart = () =>
  API.get('/cart');

export const saveCart = (items) =>
  API.post('/cart', { items });


// =========================
// UTILISATEUR
// =========================

export const loginUser = (credentials) =>
  API.post('/users/login', credentials);

export const registerUser = (userData) =>
  API.post('/users/register', userData);


// =========================
// CONTACT
// =========================

export const sendContactMessage = (messageData) =>
  API.post('/contact', messageData);


// =========================
// PAIEMENT STRIPE
// =========================

export const createCheckoutSession = (items) =>
  API.post('/payment/create-checkout-session', {
    items,
  });


// =========================
// COMMANDES
// =========================

export const getMyOrders = () =>
  API.get('/orders/my-orders');

export const getOrderBySession = (sessionId) =>
  API.get(`/orders/by-session/${sessionId}`);


// =========================
// EXPORT AXIOS
// =========================

export default API;