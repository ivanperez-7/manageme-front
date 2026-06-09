import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

import { Spinner } from '@/components/ui/spinner';

import { authGuardSilent } from '@/lib/auth';

export const Route = createFileRoute('/')({
  loader: async () => {
    const logged = await authGuardSilent();
    return { logged };
  },
  pendingMs: 200,
  pendingComponent: () => (
    <div className='flex items-center justify-center min-h-svh'>
      <Spinner />
    </div>
  ),
  component: IndexPage,
});

function IndexPage() {
  const { logged } = Route.useLoaderData();
  const router = useRouter();

  useEffect(() => {
    router.navigate({ to: logged ? '/dashboard' : '/login' });
  }, [logged]);

  return null;
}
