import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  totalItems: 0,
};

const getItemId = (item) => {
  return item._id || item.id;
};

const calculateTotalItems = (items) => {
  return items.reduce(
    (total, item) => total + Number(item.quantite || 1),
    0
  );
};

const cartSlice = createSlice({
  name: 'cart',

  initialState,

  reducers: {
    // =========================
    // AJOUTER AU PANIER
    // =========================
    addToCart: (state, action) => {
      const newItem = action.payload;

      const newItemId = getItemId(newItem);

      const existingItem = state.items.find(
        (item) => getItemId(item)?.toString() === newItemId?.toString()
      );

      const quantityToAdd = Number(newItem.quantite || 1);

      if (existingItem) {
        existingItem.quantite =
          Number(existingItem.quantite || 1) + quantityToAdd;
      } else {
        state.items.push({
          ...newItem,

          // On conserve l'identifiant MongoDB
          // et on ajoute aussi id pour compatibilité avec ton frontend
          id: newItem.id || newItem._id,
          _id: newItem._id || newItem.id,

          quantite: quantityToAdd,
        });
      }

      state.totalItems = calculateTotalItems(state.items);
    },

    // =========================
    // SUPPRIMER DU PANIER
    // =========================
    removeFromCart: (state, action) => {
      const idToRemove = action.payload;

      state.items = state.items.filter(
        (item) =>
          getItemId(item)?.toString() !== idToRemove?.toString()
      );

      state.totalItems = calculateTotalItems(state.items);
    },

    // =========================
    // MODIFIER QUANTITÉ
    // =========================
    updateQuantity: (state, action) => {
      const { id, quantite } = action.payload;

      const item = state.items.find(
        (i) => getItemId(i)?.toString() === id?.toString()
      );

      if (item) {
        const newQuantity = Number(quantite);

        if (!Number.isFinite(newQuantity) || newQuantity <= 0) {
          state.items = state.items.filter(
            (i) =>
              getItemId(i)?.toString() !== id?.toString()
          );
        } else {
          item.quantite = newQuantity;
        }
      }

      state.totalItems = calculateTotalItems(state.items);
    },

    // =========================
    // VIDER LE PANIER
    // =========================
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
    },

    // =========================
    // RÉCUPÉRER LE PANIER BACKEND
    // =========================
    updateBackendCart: (state, action) => {
      const backendItems = Array.isArray(action.payload)
        ? action.payload
        : [];

      state.items = backendItems.map((item) => ({
        ...item,

        // Compatibilité _id / id
        id: item.id || item._id,
        _id: item._id || item.id,

        quantite: Number(item.quantite || 1),
      }));

      state.totalItems = calculateTotalItems(state.items);
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  updateBackendCart,
} = cartSlice.actions;

export default cartSlice.reducer;