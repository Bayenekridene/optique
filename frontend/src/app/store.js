import { configureStore } from '@reduxjs/toolkit';
import productsSlice from '../features/productsSlice';
import cartSlice from '../features/cartSlice';
import userSlice from '../features/userSlice';

export const store = configureStore({
  reducer: {
    products: productsSlice,
    cart: cartSlice,
    user: userSlice,
  },
});