import { toast } from 'sonner';

import { withAuth } from '@/lib/auth';
import type { DashboardData, ProductoRendimiento } from '@/lib/types';
import { ENDPOINTS } from './endpoints';

export const getDashboardData = async () =>
  await withAuth
    .get(ENDPOINTS.dashboard)
    .then((res) => res.data as DashboardData)
    .catch((error) => {
      toast.error(error.message);
      return {} as DashboardData;
    });

export const getRendimientoData = async (fechaInicio?: string, fechaFin?: string) => {
  const params: Record<string, string> = {};
  if (fechaInicio) params.fechaInicio = fechaInicio;
  if (fechaFin) params.fechaFin = fechaFin;
  return await withAuth
    .get(ENDPOINTS.rendimiento, { params })
    .then((res) => res.data as ProductoRendimiento[])
    .catch((error) => {
      toast.error(error.message);
      return [] as ProductoRendimiento[];
    });
};
