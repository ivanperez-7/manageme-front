import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ENDPOINTS } from '@/api/endpoints';
import { withAuth } from '@/lib/auth';
import type { EquipoClienteResponse, LoteResponse, ProductoResponse } from '@/lib/types';

type ProductoCatalogo = Pick<ProductoResponse, 'id' | 'codigo_interno' | 'descripcion' | 'equipos'>;

export function useMovementScan() {
  const [scanCode, setScanCode] = useState('');
  const [searching, setSearching] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const handleScanSubmit = async (
    e: React.FormEvent,
    tipo: 'entrada' | 'salida',
    callbacks: {
      onProductoScanned: (producto: ProductoResponse) => void;
      onLoteScanned: (lote: LoteResponse) => void;
    }
  ) => {
    e.preventDefault();
    if (!scanCode.trim()) return;
    setSearching(true);

    try {
      if (tipo === 'entrada') {
        const { data } = await withAuth.get(ENDPOINTS.products.list, { params: { sku: scanCode } });
        const products = data as ProductoResponse[];
        if (!products.length) throw new Error('No se encontró ningún producto con este código');
        callbacks.onProductoScanned(products[0]);
      } else {
        const { data } = await withAuth.get(ENDPOINTS.lotes.list, { params: { codigo_lote: scanCode } });
        const lotes = data as LoteResponse[];

        if (!lotes.length) throw new Error('No se encontró ningún lote con este código');

        const [lote] = lotes;
        if (lote.cantidad_restante <= 0)
          throw new Error('Este lote no tiene cantidad disponible para salida');

        callbacks.onLoteScanned(lote);
      }
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
  initialData?: { items?: Array<{ producto_id: number; lote_id?: number }> },
  enabled = true
) {
  const [productosMap, setProductosMap] = useState<Record<number, ProductoCatalogo>>({});
  const [lotesMap, setLotesMap] = useState<Record<number, LoteResponse>>({});
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

      const pendingLoteIds = initialData.items
        .map((item) => (item as { lote_id?: number }).lote_id)
        .filter((id): id is number => id != null);

      if (pendingLoteIds.length) {
        try {
          const responses = await Promise.all(
            pendingLoteIds.map((loteId) => withAuth.get(ENDPOINTS.lotes.detail(loteId)))
          );
          const lotes = responses.map((r) => r.data as LoteResponse);
          setLotesMap((prev) => ({ ...prev, ...Object.fromEntries(lotes.map((l) => [l.id, l])) }));
        } catch {
          toast.error('Error al cargar la información de los lotes iniciales');
        }
      }

      setInitialLoading(false);
    };
    loadInitialData();
  }, [initialData, enabled]);

  const addProducto = (producto: ProductoCatalogo) => {
    setProductosMap((prev) => ({ ...prev, [producto.id]: producto }));
  };

  const addLote = (lote: LoteResponse) => {
    setProductosMap((prev) => ({ ...prev, [lote.producto.id]: lote.producto }));
    setLotesMap((prev) => ({ ...prev, [lote.id]: lote }));
  };

  const clearLotes = () => setLotesMap({});

  return {
    productosMap,
    lotesMap,
    initialLoading,
    addProducto,
    addLote,
    clearLotes,
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
