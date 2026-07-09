import { Bell, Check, RefreshCw } from 'lucide-react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getAlertas, refrescarAlertas, resolverAlerta } from '@/api/alertas';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { AlertaInventario } from '@/lib/types';

const TIPO_LABEL: Record<AlertaInventario['tipo_alerta'], string> = {
  low_stock: 'Stock bajo',
  old_product: 'Producto sin rotación',
  unusual_movement: 'Movimiento inusual',
  high_rotation: 'Alta rotación',
};

export function NotificationPopup() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['alertas'],
    queryFn: getAlertas,
    refetchInterval: 60_000,
  });

  const notifications = data?.results ?? [];
  const unreadCount = data?.no_leidas ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['alertas'] });
  const resolver = useMutation({ mutationFn: resolverAlerta, onSuccess: invalidate });
  const refrescar = useMutation({ mutationFn: refrescarAlertas, onSuccess: invalidate });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <Bell />
          {unreadCount > 0 && (
            <span className='absolute top-1 right-1 w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full' />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-80 p-0'>
        <div className='flex items-center justify-between border-b px-3 py-2'>
          <span className='text-sm font-medium'>Notificaciones</span>
          <Button
            variant='ghost'
            size='icon'
            disabled={refrescar.isPending}
            onClick={() => refrescar.mutate()}
          >
            <RefreshCw className={`size-4 ${refrescar.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <ItemGroup>
          {notifications.length === 0 && (
            <div className='text-center py-6 text-sm text-muted-foreground'>
              No tienes notificaciones
            </div>
          )}

          {notifications.map((n, index) => (
            <div key={n.id}>
              <Item size='sm'>
                <ItemMedia variant='icon'>
                  <Bell className='size-4' />
                </ItemMedia>

                <ItemContent>
                  <ItemTitle>{TIPO_LABEL[n.tipo_alerta] ?? n.tipo_alerta}</ItemTitle>
                  <ItemDescription className='line-clamp-none'>{n.mensaje}</ItemDescription>
                </ItemContent>

                <ItemActions>
                  <Button
                    variant='ghost'
                    size='icon'
                    disabled={resolver.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      resolver.mutate(n.id);
                    }}
                  >
                    <Check className='size-4' />
                  </Button>
                </ItemActions>
              </Item>

              {index < notifications.length - 1 && <ItemSeparator />}
            </div>
          ))}
        </ItemGroup>
      </PopoverContent>
    </Popover>
  );
}
