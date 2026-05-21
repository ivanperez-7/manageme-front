import { redirect } from '@tanstack/react-router';
import axios from 'axios';
import Cookies from 'js-cookie';

import { API_BASE, ENDPOINTS } from '@/api/endpoints';
import { authActions, authStore } from '@/stores/authStore';
import { userActions } from '@/stores/userStore';

function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.');
    const { exp } = JSON.parse(atob(payload));
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

const tryRefresh = async (): Promise<boolean> =>
  axios
    .post(ENDPOINTS.auth.refresh, undefined, { baseURL: API_BASE, withCredentials: true })
    .then((res) => {
      if (res.status !== 200) return false;
      return res.data;
    })
    .then(async ({ access }) => {
      if (!access) return false;

      authActions.setAccessToken(access);
      await withAuth.get(ENDPOINTS.auth.me).then((res) => userActions.setUserInfo(res.data));
      return true;
    })
    .catch(() => false);

export async function authGuard() {
  const token = authStore.state.accessToken;

  if (token && !isTokenExpired(token)) return;

  // If token expired or missing, try to refresh
  const refreshed = await tryRefresh();
  if (refreshed) return;

  // If refresh failed, force logout
  authActions.clear();
  throw redirect({
    to: '/login',
    search: { redirect: location.href },
    mask: { to: '/login', search: { redirect: undefined } },
  });
}

export async function authGuardSilent() {
  const token = authStore.state.accessToken;
  if (token && !isTokenExpired(token)) return true;

  const refreshed = await tryRefresh();
  return !!refreshed;
}

export const withAuth = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

withAuth.interceptors.request.use((config) => {
  const token = authStore.state.accessToken;
  const branch = Cookies.get('branch');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (branch) config.headers['x-branch-id'] = branch;
  return config;
});

// auto refresh on 401
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

withAuth.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // If refresh also fails => logout
    const forceLogout = () => {
      authActions.clear();
      window.location.href = '/login';
    };

    // Only handle 401 errors
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Avoid infinite loop
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // If already refreshing, queue requests
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(withAuth(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      // Refresh token
      const res = await axios.post(
        ENDPOINTS.auth.refresh,
        {},
        { baseURL: API_BASE, withCredentials: true }
      );

      const newToken = res.data.access;
      if (!newToken) {
        forceLogout();
        return;
      }

      // Save new token globally
      authActions.setAccessToken(newToken);

      // Release queued requests
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      isRefreshing = false;

      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return withAuth(originalRequest);
    } catch {
      forceLogout();
    }
  }
);
