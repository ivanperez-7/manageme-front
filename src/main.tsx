import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouteMask, createRouter } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';

import { ThemeProvider } from './components/theme-provider.tsx';
import { routeTree } from './routeTree.gen';

import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60_000 } },
});

const catalogsMask = createRouteMask({
  routeTree,
  from: '/catalogo',
  to: '/catalogo',
  search: { text: undefined, categoria: undefined, marca: undefined, equipo: undefined, page: undefined },
});

const catalogsDetailMask = createRouteMask({
  routeTree,
  from: '/catalogo/$id',
  to: '/catalogo/$id',
  search: { fechaInicio: undefined, fechaFin: undefined, lotesPage: undefined, movPage: undefined },
});

const clientDetailMask = createRouteMask({
  routeTree,
  from: '/clients/$id',
  to: '/clients/$id',
  search: { fechaInicio: undefined, fechaFin: undefined, movPage: undefined },
});

const movimientosMask = createRouteMask({
  routeTree,
  from: '/movements',
  to: '/movements',
  search: { fechaInicio: undefined, fechaFin: undefined, page: undefined },
});

const movimientosDetailMask = createRouteMask({
  routeTree,
  from: '/movements/$id',
  to: '/movements/$id',
  search: { itemsPage: undefined },
});

const actividadesMask = createRouteMask({
  routeTree,
  from: '/actividades',
  to: '/actividades',
  search: { usuario: undefined, accion: undefined, fechaInicio: undefined, fechaFin: undefined, page: undefined },
});

const clientsMask = createRouteMask({
  routeTree,
  from: '/clients',
  to: '/clients',
  search: { page: undefined },
});

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  routeMasks: [catalogsMask, movimientosMask, catalogsDetailMask, clientDetailMask, movimientosDetailMask, actividadesMask, clientsMask],
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
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
