'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authService, type User, type SendOTPRequest, type VerifyOTPRequest, SetupPINRequest, LoginPINRequest, PINResetInitiateRequest, PINResetConfirmRequest } from '@/services/auth';
import { apiClient } from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAuth, clearAuth, setLoading } from '@/store/slices/authSlice';

// ============================================================================
// CONTEXT
// ============================================================================

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: { access_token: string; refresh_token?: string; session_token?: string }, user: User) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, token, refreshToken, sessionToken, isLoading } = useAppSelector((state) => state.auth);
  const { push } = useRouter();

  useEffect(() => {
    // Restore session from localStorage on mount
    const storedUser = localStorage.getItem('auth_user');
    const storedToken = localStorage.getItem('auth_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const storedSessionToken = localStorage.getItem('session_token');

    if (storedUser && storedToken) {
      dispatch(setAuth({
        user: JSON.parse(storedUser),
        token: storedToken,
        refreshToken: storedRefreshToken || undefined,
        sessionToken: storedSessionToken || undefined,
      }));
    } else {
      dispatch(setLoading(false));
    }

    // Listen for session expiry from axios interceptor
    const handleSessionExpired = () => {
        logout();
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, [dispatch]);

  const login = (tokens: { access_token: string; refresh_token?: string; session_token?: string }, newUser: User) => {
    localStorage.setItem('auth_token', tokens.access_token);
    if (tokens.refresh_token) localStorage.setItem('refresh_token', tokens.refresh_token);
    if (tokens.session_token) localStorage.setItem('session_token', tokens.session_token);
    localStorage.setItem('auth_user', JSON.stringify(newUser));

    dispatch(setAuth({
      user: newUser,
      token: tokens.access_token,
      refreshToken: tokens.refresh_token,
      sessionToken: tokens.session_token,
    }));
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    localStorage.setItem('auth_user', JSON.stringify(updated));
    dispatch(setAuth({
      user: updated,
      token: token || 'mock_token',
      refreshToken: refreshToken || undefined,
      sessionToken: sessionToken || undefined,
    }));
    queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
  };

  const logout = (redirectPath: string = '/login') => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('session_token');
    localStorage.removeItem('auth_user');
    
    dispatch(clearAuth());
    queryClient.clear();
    if (redirectPath) {
      push(redirectPath);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        sessionToken,
        isAuthenticated: !!token,
        isLoading,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}

// ============================================================================
// HOOKS
// ============================================================================

export function useSendOTP() {
  return useMutation({
    mutationFn: (data: SendOTPRequest) => authService.sendOTP(data),
  });
}

export function useVerifyOTP() {
  const { login } = useAuthContext();

  return useMutation({
    mutationFn: async (data: VerifyOTPRequest) => {
      const response = await authService.verifyOTP(data);
      // We must set the token in localStorage immediately so getMe() can use it via interceptor
      localStorage.setItem('auth_token', response.access_token);
      
      try {
        const user = await authService.getMe();
        login({
          access_token: response.access_token,
          refresh_token: response.refresh_token,
          session_token: response.session_token
        }, user);
        return { ...response, user };
      } catch (error) {
        localStorage.removeItem('auth_token');
        throw error;
      }
    },
  });
}

export function useLoginWithPIN() {
  const { login } = useAuthContext();

  return useMutation({
    mutationFn: async (data: LoginPINRequest) => {
      const response = await authService.loginWithPIN(data);
      localStorage.setItem('auth_token', response.access_token);
      
      try {
        const user = await authService.getMe();
        login({
          access_token: response.access_token,
          refresh_token: response.refresh_token,
          session_token: response.session_token
        }, user);
        return { ...response, user };
      } catch (error) {
        localStorage.removeItem('auth_token');
        throw error;
      }
    },
  });
}

export function useSetupPIN() {
  return useMutation({
    mutationFn: (data: SetupPINRequest) => authService.setupPIN(data),
  });
}

export function useInitiatePINReset() {
  return useMutation({
    mutationFn: (data: PINResetInitiateRequest) => authService.initiatePINReset(data),
  });
}

export function useConfirmPINReset() {
  return useMutation({
    mutationFn: (data: PINResetConfirmRequest) => authService.confirmPINReset(data),
  });
}

/** Verify OTP only — saves new tokens to localStorage and axios defaults so following requests stay authenticated. */
export function useVerifyOTPOnly() {
  return useMutation({
    mutationFn: async (data: VerifyOTPRequest) => {
      const response = await authService.verifyOTP(data);
      if (response?.access_token) {
        localStorage.setItem('auth_token', response.access_token);
        if (response.refresh_token) localStorage.setItem('refresh_token', response.refresh_token);
        if (response.session_token) localStorage.setItem('session_token', response.session_token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`;
      }
      return response;
    },
  });
}

/** Verify PIN only — saves new tokens to localStorage and axios defaults so following requests stay authenticated. */
export function useVerifyPINOnly() {
  return useMutation({
    mutationFn: async (data: LoginPINRequest) => {
      const response = await authService.loginWithPIN(data);
      if (response?.access_token) {
        localStorage.setItem('auth_token', response.access_token);
        if (response.refresh_token) localStorage.setItem('refresh_token', response.refresh_token);
        if (response.session_token) localStorage.setItem('session_token', response.session_token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`;
      }
      return response;
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (payload?: { otp?: string; token?: string }) => authService.deleteAccount(payload),
  });
}

export function useLogout() {
  const { logout } = useAuthContext();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout();
    },
  });
}

export function useCurrentUser() {
  const { isAuthenticated } = useAuthContext();

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => authService.getMe(),
    enabled: isAuthenticated,
    staleTime: Infinity,
  });
}
