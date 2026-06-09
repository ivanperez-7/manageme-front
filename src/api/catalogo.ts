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

export type CatalogsData = {
  categorias: Types.CategoriaResponse[];
  marcas: Types.MarcaResponse[];
  equipos: Types.EquipoResponse[];
  proveedores: Types.ProveedorResponse[];
  users: Types.UserResponse[];
  clientes: Types.ClienteResponse[];
};

export type CatalogKey = keyof CatalogsData;

const _makeFetcher =
  <K extends CatalogKey>(url: string, label: string) =>
  async (): Promise<CatalogsData[K]> =>
    await withAuth
      .get(url)
      .then((res) => res.data as CatalogsData[K])
      .catch((error) => {
        console.error(`Error al cargar ${label}: ${error.message}`);
        return [] as unknown as CatalogsData[K];
      });

export const catalogFetchers: { [K in CatalogKey]: () => Promise<CatalogsData[K]> } = {
  categorias: _makeFetcher<'categorias'>(ENDPOINTS.categorias.list, 'categorías'),
  marcas: _makeFetcher<'marcas'>(ENDPOINTS.marcas.list, 'marcas'),
  equipos: _makeFetcher<'equipos'>(ENDPOINTS.equipos.list, 'equipos'),
  proveedores: _makeFetcher<'proveedores'>(ENDPOINTS.proveedores.list, 'proveedores'),
  users: _makeFetcher<'users'>(ENDPOINTS.users.list, 'usuarios'),
  clientes: _makeFetcher<'clientes'>(ENDPOINTS.clientes.list, 'clientes'),
};

export const CATALOG_KEYS = Object.keys(catalogFetchers) as CatalogKey[];

export const fetchCatalogs = async (): Promise<CatalogsData> => {
  const results = await Promise.all(CATALOG_KEYS.map((k) => catalogFetchers[k]()));
  return Object.fromEntries(CATALOG_KEYS.map((k, i) => [k, results[i]])) as CatalogsData;
};
