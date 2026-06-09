import { Store } from '@tanstack/store';

export const authStore = new Store({ accessToken: '' });

export const authActions = {
  setAccessToken: (token: string) => authStore.setState({ accessToken: token }),
  clear: () => authStore.setState({ accessToken: '' }),
};
