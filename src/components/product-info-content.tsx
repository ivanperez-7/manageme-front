import { Badge } from '@/components/ui/badge';
import type { ProductoResponse } from '@/lib/types';
import { plural } from '@/lib/utils';

export function ProductInfoContent({ producto }: { producto: ProductoResponse }) {
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <p className='text-sm text-muted-foreground'>Código</p>
          <p className='font-semibold'>{producto.codigo_interno}</p>
        </div>
        <div>
          <p className='text-sm text-muted-foreground'>SKU</p>
          <p className='font-semibold'>{producto.sku}</p>
        </div>
        <div>
          <p className='text-sm text-muted-foreground'>Categoría</p>
          <p>{producto.categoria?.nombre}</p>
        </div>
        <div>
          <p className='text-sm text-muted-foreground'>Existencia</p>
          <p>{plural('unidad', producto.cantidad_disponible)}</p>
        </div>
        <div>
          <p className='text-sm text-muted-foreground'>Stock mínimo</p>
          <p>{plural('unidad', producto.min_stock)}</p>
        </div>
        <div>
          <p className='text-sm text-muted-foreground'>Vida útil</p>
          <p>
            {producto.vida_util_unidades != null && plural('unidad', producto.vida_util_unidades)}
            {producto.vida_util_unidades != null && producto.vida_util_dias != null && ' · '}
            {producto.vida_util_dias != null && plural('día', producto.vida_util_dias)}
          </p>
        </div>
      </div>

      {producto.proveedor && (
        <div>
          <p className='text-sm text-muted-foreground'>Proveedor</p>
          <p className='font-semibold'>{producto.proveedor.nombre}</p>
        </div>
      )}

      {producto.equipos.length > 0 && (
        <div>
          <p className='text-sm text-muted-foreground'>Equipos compatibles</p>
          <div className='flex flex-wrap gap-2 mt-1'>
            {producto.equipos.map((eq) => (
              <Badge key={eq.id} variant='secondary' className='text-xs'>
                {eq.nombre} <span className='text-muted-foreground ml-0.5'>{eq.marca.nombre}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
