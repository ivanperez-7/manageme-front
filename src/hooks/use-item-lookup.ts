import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ENDPOINTS } from '@/api/endpoints';
import { withAuth } from '@/lib/auth';
import type { LoteResponse, ProductoResponse } from '@/lib/types';

type ProductoCatalogo = Pick<ProductoResponse, 'id' | 'codigo_interno' | 'descripcion' | 'equipos'>;

export function useItemLookup(initialData?: { items?: Array<{ producto_id: number; lote_id?: number }> }) {
  const [productosMap, setProductosMap] = useState<Record<number, ProductoCatalogo>>({});
  const [lotesMap, setLotesMap] = useState<Record<number, LoteResponse>>({});
  const [initialProductsLoading, setInitialProductsLoading] = useState(() =>
    Boolean(initialData?.items?.length)
  );
  const [initialLotesLoading, setInitialLotesLoading] = useState(() =>
    Boolean(initialData?.items?.some((item) => 'lote_id' in item))
  );

  useEffect(() => {
    const loadInitialData = async () => {
      if (!initialData?.items?.length) return;
      setInitialProductsLoading(true);

      const pendingIds = initialData.items.map((item) => item.producto_id);
      if (pendingIds.length) {
        try {
          const responses = await Promise.all(
            pendingIds.map((productoId) => withAuth.get(ENDPOINTS.products.detail(productoId)))
          );
          const products = responses.map((r) => r.data as ProductoResponse);
          setProductosMap((prev) => ({ ...prev, ...Object.fromEntries(products.map((p) => [p.id, p])) }));
        } catch {
          toast.error('Error al cargar la información de los productos iniciales');
        } finally {
          setInitialProductsLoading(false);
        }
      } else {
        setInitialProductsLoading(false);
      }

      const pendingLoteIds = initialData.items
        .map((item) => (item as { lote_id?: number }).lote_id)
        .filter((id): id is number => id != null);

      if (pendingLoteIds.length) {
        setInitialLotesLoading(true);
        try {
          const responses = await Promise.all(
            pendingLoteIds.map((loteId) => withAuth.get(ENDPOINTS.lotes.detail(loteId)))
          );
          const lotes = responses.map((r) => r.data as LoteResponse);
          setLotesMap((prev) => ({ ...prev, ...Object.fromEntries(lotes.map((l) => [l.id, l])) }));
        } catch {
          toast.error('Error al cargar la información de los lotes iniciales');
        } finally {
          setInitialLotesLoading(false);
        }
      } else {
        setInitialLotesLoading(false);
      }
    };
    loadInitialData();
  }, [initialData]);

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
    initialProductsLoading,
    initialLotesLoading,
    addProducto,
    addLote,
    clearLotes,
  };
}
