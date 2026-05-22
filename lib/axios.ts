import axios from 'axios';
import { ENV } from '@/constants/env';

// Create axios instance
if (typeof window !== 'undefined') {
  console.log('[Axios] Initializing with baseURL:', ENV.API_BASE_URL);
}
export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors and token refresh
let isRefreshing = false;

interface FailedRequest {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // Handle standard Zexy API wrapper { success: true, data: {}, error: null }
    if (response.data && response.data.success === false) {
        // Handle both new flat format (data.message) and legacy nested format (data.error.message)
        const errorMsg = response.data.message || response.data.error?.message || 'API Error';
        const error = new Error(errorMsg) as Error & { response?: unknown; data?: unknown };
        error.response = response;
        error.data = response.data;
        return Promise.reject(error);
    }
    return response;
  },
  async (error) => {
    if (typeof window === 'undefined') {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const status = error.response?.status;

    // 1. Handle 401 Unauthorized with token refresh
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      const sessionToken = localStorage.getItem('session_token');

      if (refreshToken && sessionToken) {
        try {
          console.log('[Axios] Attempting token refresh...');
          // Use basic axios to avoid interceptor loop
          const response = await axios.post(`${ENV.API_BASE_URL}/api/v1/auth/token/refresh`, {
            refresh_token: refreshToken,
            session_token: sessionToken,
          });

          // Support both wrapped { success: true, data: {} } and flat response
          const tokenData = response.data.data || response.data;
          const { access_token, refresh_token: newRefreshToken } = tokenData;

          localStorage.setItem('auth_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);

          apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
          originalRequest.headers['Authorization'] = 'Bearer ' + access_token;

          processQueue(null, access_token);
          console.log('[Axios] Token refresh successful');
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error('[Axios] Token refresh failed:', refreshError);
          processQueue(refreshError, null);
          
          // Refresh failed - complete logout
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('session_token');
          localStorage.removeItem('auth_user');
          window.dispatchEvent(new CustomEvent('session-expired'));
          
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    // 2. Handle 403 or 401 where refresh is not possible
    if (status === 403 || status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('session_token');
      localStorage.removeItem('auth_user');
      
      // Dispatch session expired event
      window.dispatchEvent(new CustomEvent('session-expired'));
      
      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
