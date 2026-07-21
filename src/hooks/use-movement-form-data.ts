import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ENDPOINTS } from '@/api/endpoints';
import { withAuth } from '@/lib/auth';
import type { EquipoClienteResponse, ProductoResponse } from '@/lib/types';

type ProductoCatalogo = ProductoResponse;

export function useMovementScan() {
  const [scanCode, setScanCode] = useState('');
  const [searching, setSearching] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const handleScanSubmit = async (
    e: React.FormEvent,
    _tipo: 'entrada' | 'salida',
    callbacks: {
      onProductoScanned: (producto: ProductoResponse) => void;
    }
  ) => {
    e.preventDefault();
    if (!scanCode.trim()) return;
    setSearching(true);

    try {
      const { data } = await withAuth.get(ENDPOINTS.products.list, { params: { sku: scanCode } });
      const products = data as ProductoResponse[];
      if (!products.length) throw new Error('No se encontró ningún producto con este código');
      callbacks.onProductoScanned(products[0]);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSearching(false);
      setScanCode('');
      scanInputRef.current?.focus();
    }
  };

  return { scanCode, setScanCode, searching, handleScanSubmit, scanInputRef };
}

export function useItemLookup(
  initialData?: { items?: Array<{ producto_id: number }> },
  enabled = true
) {
  const [productosMap, setProductosMap] = useState<Record<number, ProductoCatalogo>>({});
  const [initialLoading, setInitialLoading] = useState(() => Boolean(initialData?.items?.length));

  useEffect(() => {
    if (!enabled) return;
    const loadInitialData = async () => {
      if (!initialData?.items?.length) return;

      const pendingIds = initialData.items.map((item) => item.producto_id);
      try {
        const responses = await Promise.all(
          pendingIds.map((productoId) => withAuth.get(ENDPOINTS.products.detail(productoId)))
        );
        const products = responses.map((r) => r.data as ProductoResponse);
        setProductosMap((prev) => ({ ...prev, ...Object.fromEntries(products.map((p) => [p.id, p])) }));
      } catch {
        toast.error('Error al cargar la información de los productos iniciales');
      }

      setInitialLoading(false);
    };
    loadInitialData();
  }, [initialData, enabled]);

  const addProducto = (producto: ProductoCatalogo) => {
    setProductosMap((prev) => ({ ...prev, [producto.id]: producto }));
  };

  return {
    productosMap,
    initialLoading,
    addProducto,
  };
}

export function useClientEquipos(clienteId?: number, productoIds: number[] = []) {
  const ids = [...productoIds].sort((a, b) => a - b);

  const { data, isLoading } = useQuery({
    queryKey: ['clientEquipos', clienteId, ids],
    enabled: clienteId != null && ids.length > 0,
    queryFn: async () => {
      const { data } = await withAuth.get(ENDPOINTS.clientes.detail(clienteId!) + 'equipos/', {
        params: { productos: ids },
      });
      return data as EquipoClienteResponse[];
    },
  });

  return { clientEquipos: data ?? [], loadingClientEquipos: isLoading };
}
