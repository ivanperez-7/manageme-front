import { RouterProvider, createRouteMask, createRouter } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';

import { ThemeProvider } from './components/theme-provider.tsx';
import { routeTree } from './routeTree.gen';

import './styles.css';

const catalogsMask = createRouteMask({
  routeTree,
  from: '/catalogo',
  to: '/catalogo',
  search: { text: undefined, categoria: undefined, marca: undefined, equipo: undefined, page: undefined },
});

const movimientosMask = createRouteMask({
  routeTree,
  from: '/movements',
  to: '/movements',
  search: { fechaInicio: undefined, fechaFin: undefined },
});

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  routeMasks: [catalogsMask, movimientosMask],
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
