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
  const [producto, lotes] = await Promise.all([
    withAuth
      .get(ENDPOINTS.products.detail(id))
      .then((res) => res.data as Types.ProductoResponse)
      .catch(() => {
        throw redirect({ to: '/catalogo' });
      }),
    withAuth
      .get(ENDPOINTS.lotes.list, { params: { producto: id } })
      .then((res) => res.data as Types.LoteResponse[])
      .catch((error) => {
        toast.error(error.message);
        return [] as Types.LoteResponse[];
      }),
  ]);

  return { producto, lotes };
};

export const fetchCatalogs = async () => {
  const [categorias, marcas, equipos, proveedores, users, clientes] = await Promise.all([
    withAuth
      .get(ENDPOINTS.categorias.list)
      .then((res) => res.data as Types.CategoriaResponse[])
      .catch((error) => {
        console.error(`Error al cargar categorías: ${error.message}`);
        return [] as Types.CategoriaResponse[];
      }),
    withAuth
      .get(ENDPOINTS.marcas.list)
      .then((res) => res.data as Types.MarcaResponse[])
      .catch((error) => {
        console.error(`Error al cargar marcas: ${error.message}`);
        return [] as Types.MarcaResponse[];
      }),
    withAuth
      .get(ENDPOINTS.equipos.list)
      .then((res) => res.data as Types.EquipoResponse[])
      .catch((error) => {
        console.error(`Error al cargar equipos: ${error.message}`);
        return [] as Types.EquipoResponse[];
      }),
    withAuth
      .get(ENDPOINTS.proveedores.list)
      .then((res) => res.data as Types.ProveedorResponse[])
      .catch((error) => {
        console.error(`Error al cargar proveedores: ${error.message}`);
        return [] as Types.ProveedorResponse[];
      }),
    withAuth
      .get(ENDPOINTS.users.list)
      .then((res) => res.data as Types.UserResponse[])
      .catch((error) => {
        console.error(`Error al cargar usuarios: ${error.message}`);
        return [] as Types.UserResponse[];
      }),
    withAuth
      .get(ENDPOINTS.clientes.list)
      .then((res) => res.data as Types.ClienteResponse[])
      .catch((error) => {
        console.error(`Error al cargar clientes: ${error.message}`);
        return [] as Types.ClienteResponse[];
      }),
  ]);

  return { categorias, marcas, equipos, proveedores, users, clientes };
};
