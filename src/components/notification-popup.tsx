import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Activity,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Hourglass,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { getAlertas, refrescarAlertas, resolverAlerta } from '@/api/alertas';
import { Button } from '@/components/ui/button';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
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
import { cn } from '@/lib/utils';

const TIPO_META: Record<
  AlertaInventario['tipo_alerta'],
  { label: string; icon: LucideIcon; className: string }
> = {
  low_stock: { label: 'Stock bajo', icon: TrendingDown, className: 'text-red-600 dark:text-red-400' },
  old_product: { label: 'Producto sin rotación', icon: Hourglass, className: 'text-amber-600 dark:text-amber-400' },
  unusual_movement: { label: 'Movimiento inusual', icon: Activity, className: 'text-blue-600 dark:text-blue-400' },
  high_rotation: { label: 'Alta rotación', icon: TrendingUp, className: 'text-emerald-600 dark:text-emerald-400' },
};

export function NotificationPopup() {
  const [open, setOpen] = useState(false);
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
  const resolverTodas = useMutation({
    mutationFn: () => Promise.all(notifications.map((n) => resolverAlerta(n.id))),
    onSuccess: invalidate,
  });

  useEffect(() => {
    refrescar.mutate();
    const interval = setInterval(() => refrescar.mutate(), 300_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative' aria-label='Notificaciones'>
          <Bell />
          {unreadCount > 0 && (
            <span className='absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white dark:bg-red-500'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-96 p-0' align='end'>
        <div className='flex items-center justify-between border-b px-3 py-2'>
          <span className='text-sm font-medium'>Notificaciones</span>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              aria-label='Marcar todas como leídas'
              title='Marcar todas como leídas'
              disabled={resolverTodas.isPending || notifications.length === 0}
              onClick={() => resolverTodas.mutate()}
            >
              <CheckCheck className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label='Actualizar'
              title='Actualizar'
              disabled={refrescar.isPending}
              onClick={() => refrescar.mutate()}
            >
              <RefreshCw className={cn('size-4', refrescar.isPending && 'animate-spin')} />
            </Button>
          </div>
        </div>

        <ItemGroup className='max-h-96 overflow-y-auto'>
          {notifications.length === 0 && (
            <Empty className='border-none py-8'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <BellOff />
                </EmptyMedia>
                <EmptyTitle className='text-base'>No tienes notificaciones</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}

          {notifications.map((n, index) => {
            const meta = TIPO_META[n.tipo_alerta] ?? {
              label: n.tipo_alerta,
              icon: Bell,
              className: 'text-muted-foreground',
            };
            const Icon = meta.icon;

            return (
              <div key={n.id}>
                <Item size='sm' asChild>
                  <Link
                    to='/catalogo/$id'
                    params={{ id: String(n.producto.id) }}
                    onClick={() => setOpen(false)}
                  >
                    <ItemMedia variant='icon'>
                      <Icon className={cn('size-4', meta.className)} />
                    </ItemMedia>

                    <ItemContent>
                      <ItemTitle>{meta.label}</ItemTitle>
                      <ItemDescription className='line-clamp-none'>{n.mensaje}</ItemDescription>
                      <span className='text-muted-foreground text-xs'>
                        {formatDistanceToNow(new Date(n.creado), { addSuffix: true, locale: es })}
                      </span>
                    </ItemContent>

                    <ItemActions>
                      <Button
                        variant='ghost'
                        size='icon'
                        aria-label='Marcar como leída'
                        title='Marcar como leída'
                        disabled={resolver.isPending}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          resolver.mutate(n.id);
                        }}
                      >
                        <Check className='size-4' />
                      </Button>
                    </ItemActions>
                  </Link>
                </Item>

                {index < notifications.length - 1 && <ItemSeparator />}
              </div>
            );
          })}
        </ItemGroup>
      </PopoverContent>
    </Popover>
  );
}
