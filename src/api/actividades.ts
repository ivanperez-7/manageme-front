import { withAuth } from '@/lib/auth';
import type { ActividadResponse } from '@/lib/types';
import { ENDPOINTS } from './endpoints';

type FetchActividadesOptions = {
  usuario?: number;
  accion?: string;
  fechaInicio?: string;
  fechaFin?: string;
};

export const fetchActividades = async (opts: FetchActividadesOptions = {}) => {
  const params: Record<string, string | number> = {};
  if (opts.usuario) params.usuario = opts.usuario;
  if (opts.accion) params.accion = opts.accion;
  if (opts.fechaInicio) params.fechaInicio = opts.fechaInicio;
  if (opts.fechaFin) params.fechaFin = opts.fechaFin;

  return await withAuth
    .get(ENDPOINTS.system.actividades, { params })
    .then((res) => res.data as ActividadResponse[])
    .catch((error) => {
      throw new Error(error.message);
    });
};
