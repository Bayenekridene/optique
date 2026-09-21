import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, registerUser } from '../services/api';

// =========================
// CONNEXION
// =========================

export const login = createAsyncThunk(
  'user/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginUser(credentials);

      const user = response.data?.user || response.data;

      const isAdmin = user.role === 'admin';

      const isApproved =
        isAdmin ||
        user.isApproved === true ||
        user.status === 'approved';

      // Sauvegarde du JWT
      if (user.token) {
        localStorage.setItem('token', user.token);
      }

      return {
        ...user,

        id: user._id || user.id,

        name:
          user.name ||
          user.nom ||
          credentials.email.split('@')[0],

        email:
          user.email ||
          credentials.email,

        role:
          user.role ||
          (isAdmin ? 'admin' : 'client'),

        isAdmin,

        isApproved,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        'Erreur de connexion'
      );
    }
  }
);


// =========================
// INSCRIPTION
// =========================

export const register = createAsyncThunk(
  'user/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await registerUser(userData);

      const user =
        response.data?.user ||
        response.data;

      const isAdmin =
        user.role === 'admin';

      // Une inscription normale n'est jamais approuvée automatiquement
      const isApproved = isAdmin;

      return {
        ...user,

        id: user._id || user.id,

        name:
          user.name ||
          user.nom ||
          userData.email.split('@')[0],

        email:
          user.email ||
          userData.email,

        role:
          user.role ||
          (isAdmin ? 'admin' : 'client'),

        isAdmin,

        isApproved,

        status:
          user.status ||
          'pending',
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Erreur lors de l'inscription"
      );
    }
  }
);


// =========================
// SLICE
// =========================

const userSlice = createSlice({
  name: 'user',

  initialState: {
    userInfo:
      JSON.parse(
        localStorage.getItem('userInfo')
      ) || null,

    authStatus:
      localStorage.getItem('authStatus') ||
      'notConnected',

    status: 'idle',

    error: null,
  },

  reducers: {

    // =========================
    // DÉCONNEXION
    // =========================

    logout: (state) => {
      state.userInfo = null;
      state.authStatus = 'notConnected';

      localStorage.removeItem('userInfo');
      localStorage.removeItem('authStatus');

      // Suppression du JWT
      localStorage.removeItem('token');
    },


    // =========================
    // MODIFIER LE STATUT
    // =========================

    updateUserStatus: (state, action) => {
      const {
        id,
        isApproved,
        role,
      } = action.payload;

      if (
        state.userInfo &&
        state.userInfo.id === id
      ) {
        state.userInfo.isApproved =
          isApproved;

        state.userInfo.role =
          role ||
          state.userInfo.role;

        state.userInfo.isAdmin =
          state.userInfo.role === 'admin';

        state.authStatus =
          isApproved
            ? 'approved'
            : 'pendingApproval';

        localStorage.setItem(
          'userInfo',
          JSON.stringify(state.userInfo)
        );

        localStorage.setItem(
          'authStatus',
          state.authStatus
        );
      }
    },
  },


  // =========================
  // ACTIONS ASYNCHRONES
  // =========================

  extraReducers: (builder) => {
    builder

      // =========================
      // LOGIN
      // =========================

      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })

      .addCase(
        login.fulfilled,
        (state, action) => {
          state.status = 'succeeded';

          state.userInfo =
            action.payload;

          state.authStatus =
            action.payload.isApproved
              ? 'approved'
              : 'pendingApproval';

          localStorage.setItem(
            'userInfo',
            JSON.stringify(
              action.payload
            )
          );

          localStorage.setItem(
            'authStatus',
            state.authStatus
          );
        }
      )

      .addCase(
        login.rejected,
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        }
      )


      // =========================
      // REGISTER
      // =========================

      .addCase(
        register.pending,
        (state) => {
          state.status = 'loading';
          state.error = null;
        }
      )

      .addCase(
        register.fulfilled,
        (state, action) => {
          state.status = 'succeeded';

          state.userInfo =
            action.payload;

          state.authStatus =
            action.payload.isApproved
              ? 'approved'
              : 'pendingApproval';

          localStorage.setItem(
            'userInfo',
            JSON.stringify(
              action.payload
            )
          );

          localStorage.setItem(
            'authStatus',
            state.authStatus
          );
        }
      )

      .addCase(
        register.rejected,
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        }
      );
  },
});

export const {
  logout,
  updateUserStatus,
} = userSlice.actions;

export default userSlice.reducer;