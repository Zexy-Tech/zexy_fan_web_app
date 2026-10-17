import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: number;
  mobile: string | null;
  username: string | null;
  name: string | null;
  avatar: string | null;
  role: 'fan' | 'creator' | 'admin';
  has_completed_onboarding: boolean;
  onboarding_step?: number;
  is_mobile_verified?: boolean;
  email?: string | null;
  city?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  sessionToken: string | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  sessionToken: null,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User; token: string; refreshToken?: string; sessionToken?: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      state.sessionToken = action.payload.sessionToken || null;
      state.isLoading = false;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.sessionToken = null;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setAuth, updateUser, clearAuth, setLoading } = authSlice.actions;
export default authSlice.reducer;
