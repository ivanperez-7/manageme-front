import { Outlet, createFileRoute, useRouter } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { useTheme } from '@/components/theme-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';

import { ENDPOINTS } from '@/api/endpoints';
import { authGuard, withAuth } from '@/lib/auth';
import { authActions } from '@/stores/authStore';

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => await authGuard(),
  component: AppLayout,
});

function AppLayout() {
  const [loadingLogout, setLoadingLogout] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();

  const onLogout = async () => {
    if (loadingLogout) return;

    setLoadingLogout(true);
    withAuth
      .post(ENDPOINTS.auth.logout)
      .then(() => {
        authActions.setLoggedOut();
        router.navigate({ to: '/login', search: { redirect: undefined } });
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoadingLogout(false));
  };

  return (
    <SidebarProvider>
      <AppSidebar onLogout={onLogout} loadingLogout={loadingLogout} />
      <SidebarInset>
        <Toaster position='top-right' richColors theme={theme} />
        <SiteHeader />
        <div className='p-4 md:pt-7 md:px-11'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={router.state.location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
