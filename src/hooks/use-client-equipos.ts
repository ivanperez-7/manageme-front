import { useState } from 'react';

import { ENDPOINTS } from '@/api/endpoints';
import { withAuth } from '@/lib/auth';
import type { EquipoClienteResponse } from '@/lib/types';

export function useClientEquipos() {
  const [clientEquipos, setClientEquipos] = useState<EquipoClienteResponse[]>([]);
  const [loadingClientEquipos, setLoadingClientEquipos] = useState(false);

  const check = async (clienteId: string|number, selectedProductos: number[]) => {
    if (!selectedProductos.length) return;
    setLoadingClientEquipos(true);

    try {
      const { data } = await withAuth.get(ENDPOINTS.clientes.detail(clienteId) + 'equipos/', {
        params: { productos: selectedProductos },
      });
      setClientEquipos(data as EquipoClienteResponse[]);
    } finally {
      setLoadingClientEquipos(false);
    }
  };

  return { clientEquipos, loadingClientEquipos, check };
}
