import { redirect } from '@tanstack/react-router';
import { toast } from 'sonner';

import { withAuth } from '@/lib/auth';
import type * as Types from '@/lib/types';

import { ENDPOINTS } from './endpoints';

export const fetchProveedorById = async (id: string | number) => {
  const [proveedor, productos] = await Promise.all([
    withAuth
      .get(ENDPOINTS.proveedores.detail(id))
      .then((res) => res.data as Types.ProveedorResponse)
      .catch(() => {
        throw redirect({ to: '/suppliers' });
      }),
    withAuth
      .get(ENDPOINTS.products.list, { params: { proveedor: id } })
      .then((res) => res.data as Types.ProductoResponse[])
      .catch((error) => {
        toast.error(error.message);
        return [] as Types.ProductoResponse[];
      }),
  ]);

  return { proveedor, productos };
};
