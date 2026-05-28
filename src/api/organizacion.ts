import type { SucursalResponse } from '@/lib/types';
import { redirect } from '@tanstack/react-router';
import axios from 'axios';

import { API_BASE, ENDPOINTS } from './endpoints';
import { withAuth } from '@/lib/auth';
import type * as Types from '@/lib/types';

export const getSucursales = async () =>
  axios
    .get(ENDPOINTS.sucursales.list, { baseURL: API_BASE })
    .then((response) => response.data as SucursalResponse[])
    .catch((error) => {
      throw new Error(error.message);
    });

export const fetchClientById = async (id: string | number) => {
  const cliente = await withAuth
    .get(ENDPOINTS.clientes.detail(id))
    .then((res) => res.data as Types.ClienteResponse)
    .catch(() => {
      throw redirect({ to: '/clients' });
    });

  const equiposCliente = await withAuth
    .get(ENDPOINTS.clientes.detail(id) + 'equipos/')
    .then((res) => res.data as Types.EquipoClienteResponse[])
    .catch((error) => {
      throw new Error(error.message);
    });

  return { cliente, equiposCliente };
};
