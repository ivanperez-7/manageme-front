import { withAuth } from '@/lib/auth';
import type { ReordenProveedor } from '@/lib/types';
import { ENDPOINTS } from './endpoints';

export async function fetchReorden() {
  const res = await withAuth.get(ENDPOINTS.reorden.sugerencias);
  return res.data as ReordenProveedor[];
}
