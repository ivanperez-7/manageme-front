import { withAuth } from '@/lib/auth';
import type { AlertasListResponse, AlertasRefrescarResponse } from '@/lib/types';

import { ENDPOINTS } from './endpoints';

export const getAlertas = () =>
  withAuth
    .get(ENDPOINTS.system.alertas, { params: { resuelto: false } })
    .then((res) => res.data as AlertasListResponse);

export const resolverAlerta = (id: number) =>
  withAuth.patch(ENDPOINTS.system.alertaDetail(id), { resuelto: true });

export const refrescarAlertas = () =>
  withAuth
    .post(ENDPOINTS.system.alertasRefrescar)
    .then((res) => res.data as AlertasRefrescarResponse);
