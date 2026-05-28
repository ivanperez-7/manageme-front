import { redirect } from '@tanstack/react-router';
import { toast } from 'sonner';

import { withAuth } from '@/lib/auth';
import type * as Types from '@/lib/types';
import { ENDPOINTS } from './endpoints';

export const fetchAllProductos = async () =>
  await withAuth
    .get(ENDPOINTS.products.list)
    .then((res) => res.data as Types.ProductoResponse[])
    .catch((error) => {
      throw new Error(error.message);
    });

export const fetchProductoById = async (id: string | number) => {
  const producto = await withAuth
    .get(ENDPOINTS.products.detail(id))
    .then((res) => res.data as Types.ProductoResponse)
    .catch(() => {
      throw redirect({ to: '/catalogo' });
    });

  const lotes = await withAuth
    .get(ENDPOINTS.lotes.list, { params: { producto: id } })
    .then((res) => res.data as Types.LoteResponse[])
    .catch((error) => {
      toast.error(error.message);
      return [] as Types.LoteResponse[];
    });

  return { producto, lotes };
};

export const fetchCatalogs = async () => {
  const categorias = await withAuth
    .get(ENDPOINTS.categorias.list)
    .then((res) => res.data as Types.CategoriaResponse[])
    .catch((error) => {
      throw new Error(error.message);
    });

  const marcas = await withAuth
    .get(ENDPOINTS.marcas.list)
    .then((res) => res.data as Types.MarcaResponse[])
    .catch((error) => {
      throw new Error(error.message);
    });

  const equipos = await withAuth
    .get(ENDPOINTS.equipos.list)
    .then((res) => res.data as Types.EquipoResponse[])
    .catch((error) => {
      throw new Error(error.message);
    });

  const proveedores = await withAuth
    .get(ENDPOINTS.proveedores.list)
    .then((res) => res.data as Types.ProveedorResponse[])
    .catch((error) => {
      throw new Error(error.message);
    });

  const users = await withAuth
    .get(ENDPOINTS.users.list)
    .then((res) => res.data as Types.UserResponse[])
    .catch((error) => {
      throw new Error(error.message);
    });

  const clientes = await withAuth
    .get(ENDPOINTS.clientes.list)
    .then((res) => res.data as Types.ClienteResponse[])
    .catch((error) => {
      throw new Error(error.message);
    });

  return { categorias, marcas, equipos, proveedores, users, clientes };
};
