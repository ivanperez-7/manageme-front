import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { ENDPOINTS } from '@/api/endpoints';
import { withAuth } from '@/lib/auth';
import type { LoteResponse, ProductoResponse } from '@/lib/types';

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
