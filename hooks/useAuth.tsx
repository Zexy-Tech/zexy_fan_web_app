'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authService, type User, type SendOTPRequest, type VerifyOTPRequest } from '@/services/auth';
import { queryClient } from '@/lib/queryClient';

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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load from localStorage on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const storedSessionToken = localStorage.getItem('session_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      setSessionToken(storedSessionToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Listen for session expiry
    const handleSessionExpired = () => {
      setToken(null);
      setRefreshToken(null);
      setSessionToken(null);
      setUser(null);
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  const login = (tokens: { access_token: string; refresh_token?: string; session_token?: string }, newUser: User) => {
    localStorage.setItem('auth_token', tokens.access_token);
    if (tokens.refresh_token) localStorage.setItem('refresh_token', tokens.refresh_token);
    if (tokens.session_token) localStorage.setItem('session_token', tokens.session_token);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    
    setToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token || null);
    setSessionToken(tokens.session_token || null);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('session_token');
    localStorage.removeItem('auth_user');
    
    setToken(null);
    setRefreshToken(null);
    setSessionToken(null);
    setUser(null);
    queryClient.clear();
    router.push('/login');
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
    mutationFn: (data: VerifyOTPRequest) => authService.verifyOTP(data),
    onSuccess: async (response) => {
      // Temporarily store access_token so getMe() can use it via axios interceptor
      localStorage.setItem('auth_token', response.access_token);
      
      try {
        // Fetch user profile
        const user = await authService.getMe();
        
        // Properly login with all tokens and user data
        login({
          access_token: response.access_token,
          refresh_token: response.refresh_token,
          session_token: response.session_token
        }, user);
      } catch (error) {
        // If profile fetch fails, clear the token we just set
        localStorage.removeItem('auth_token');
        throw error;
      }
    },
  });
}

/** Verify OTP only — does not replace session or call login (e.g. sensitive actions). */
export function useVerifyOTPOnly() {
  return useMutation({
    mutationFn: (data: VerifyOTPRequest) => authService.verifyOTP(data),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (payload?: { otp?: string }) => authService.deleteAccount(payload),
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
