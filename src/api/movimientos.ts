import { toast } from 'sonner';
import { redirect } from '@tanstack/react-router';

import { withAuth } from '@/lib/auth';
import type { MovimientoResponse } from '@/lib/types';
import { ENDPOINTS } from './endpoints';

type FetchMovimientosOptions = {
  fechaInicio?: string;
  fechaFin?: string;
  productoId?: string | number;
  clienteId?: string | number;
};

export const fetchMovimientos = async ({
  fechaInicio,
  fechaFin,
  productoId,
  clienteId,
}: FetchMovimientosOptions = {}) => {
  const params: Record<string, string | number> = {};
  if (fechaInicio) params.fechaInicio = fechaInicio;
  if (fechaFin) params.fechaFin = fechaFin;
  if (productoId) params.items__producto = productoId;
  if (clienteId) params.detalle_salida__cliente = clienteId;

  const movimientos = await withAuth
    .get(ENDPOINTS.movimientos.list, { params })
    .then((res) => res.data as MovimientoResponse[])
    .catch((error) => {
      toast.error(error.message);
      return [];
    });

  const oldestDate = await withAuth
    .get(ENDPOINTS.movimientos.list + 'get_oldest/', { params })
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
