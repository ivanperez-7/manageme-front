import { Store } from '@tanstack/store';

export const authStore = new Store({ accessToken: '', loggedOut: false });

export const authActions = {
  setAccessToken: (token: string) =>
    authStore.setState((state) => ({ ...state, accessToken: token, loggedOut: false })),
  clear: () =>
    authStore.setState((state) => ({ ...state, accessToken: '' })),
  setLoggedOut: () =>
    authStore.setState((state) => ({ ...state, accessToken: '', loggedOut: true })),
};
