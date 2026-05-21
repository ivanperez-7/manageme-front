import { toast } from 'sonner';
import { redirect } from '@tanstack/react-router';

import { withAuth } from '@/lib/auth';
import type { MovimientoResponse } from '@/lib/types';
import { ENDPOINTS } from './endpoints';

export const fetchMovimientos = async (fechaInicio: string, fechaFin: string) => {
  const movimientos = await withAuth
    .get(ENDPOINTS.movimientos.list, { params: { fechaInicio, fechaFin } })
    .then((res) => res.data as MovimientoResponse[])
    .catch((error) => {
      toast.error(error.message);
      return [];
    });

  const oldestDate = await withAuth
    .get(ENDPOINTS.movimientos.list + 'get_oldest/')
    .then((res) => res.data as string)
    .catch((error) => {
      toast.error(error.message);
      return '';
    });

  return { movimientos, oldestDate };
};

export const fetchMovimientoById = async (id: string | number) =>
  await withAuth
    .get(ENDPOINTS.movimientos.detail(id))
    .then((res) => res.data as MovimientoResponse)
    .catch(() => {
      throw redirect({ to: '/movements' });
    });
