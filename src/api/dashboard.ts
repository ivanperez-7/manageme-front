import { toast } from 'sonner';

import { withAuth } from '@/lib/auth';
import type { DashboardData } from '@/lib/types';
import { ENDPOINTS } from './endpoints';

export const getDashboardData = async () =>
  await withAuth
    .get(ENDPOINTS.dashboard)
    .then((res) => res.data as DashboardData)
    .catch((error) => {
      toast.error(error.message);
      return {} as DashboardData;
    });
