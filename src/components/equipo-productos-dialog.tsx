import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { DataTable } from './data-table';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty';
import { Separator } from './ui/separator';

import { ENDPOINTS } from '@/api/endpoints';
import { withAuth } from '@/lib/auth';
import type {
  EquipoClienteResponse,
  EquipoResponse,
  EquipoStatsResponse,
  ProductoResponse,
} from '@/lib/types';
import { plural } from '@/lib/utils';

const columns: ColumnDef<ProductoResponse>[] = [
  {
    accessorKey: 'codigo_interno',
    header: 'Código',
  },
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
    cell: ({ row }) => (
      <Link
        to='/catalogo/$id'
        params={{ id: String(row.original.id) }}
        className='font-semibold hover:underline'
      >
        {row.getValue('descripcion')}
      </Link>
    ),
  },
  {
    accessorKey: 'categoria.nombre',
    header: 'Categoría',
  },
  {
    accessorKey: 'proveedor.nombre',
    header: 'Proveedor',
    cell: ({ row }) => row.original.proveedor?.nombre || '—',
  },
  {
    accessorKey: 'cantidad_disponible',
    header: 'Existencia',
    cell: ({ row }) => <span>{plural('unidad', row.original.cantidad_disponible)}</span>,
  },
];

const clienteColumns: ColumnDef<EquipoClienteResponse>[] = [
  {
    accessorKey: 'cliente_nombre',
    header: 'Cliente',
    cell: ({ row }) => (
      <Link
        to='/clients/$id'
        params={{ id: String(row.original.cliente_id) }}
        className='font-semibold hover:underline'
      >
        {row.getValue('cliente_nombre')}
      </Link>
    ),
  },
  {
    accessorKey: 'alias',
    header: 'Alias',
  },
  {
    accessorKey: 'contador_uso',
    header: 'Contador del equipo',
  },
];

export function EquipoProductosDialog({
  equipo,
  open,
  onOpenChange,
}: {
  equipo: EquipoResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [productos, setProductos] = useState<ProductoResponse[]>([]);
  const [productosLoading, setProductosLoading] = useState(false);
  const [clientes, setClientes] = useState<EquipoClienteResponse[]>([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [stats, setStats] = useState<EquipoStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setProductosLoading(true);
    setClientesLoading(true);
    setStatsLoading(true);

    withAuth
      .get(ENDPOINTS.products.list, { params: { equipos: equipo.id } })
      .then(({ data }) => setProductos(data as ProductoResponse[]))
      .catch(() => setProductos([]))
      .finally(() => setProductosLoading(false));

    withAuth
      .get(ENDPOINTS.equipos.clientes(equipo.id))
      .then(({ data }) => setClientes(data as EquipoClienteResponse[]))
      .catch(() => setClientes([]))
      .finally(() => setClientesLoading(false));

    withAuth
      .get(ENDPOINTS.equipos.stats(equipo.id))
      .then(({ data }) => setStats(data as EquipoStatsResponse))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [open, equipo.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[80vh] max-w-full flex-col md:max-w-4xl lg:max-w-6xl'>
        <DialogHeader>
          <DialogTitle>Equipo: {equipo.nombre}</DialogTitle>
          <DialogDescription>Productos compatibles, clientes que lo usan y estadísticas.</DialogDescription>
        </DialogHeader>

        {statsLoading ? (
          <div className='flex items-center justify-center py-4'>
            <Loader2 className='size-6 animate-spin text-muted-foreground' />
          </div>
        ) : stats ? (
          <div className='-mx-6 mb-4 grid grid-cols-2 gap-3 px-6 sm:grid-cols-3 lg:grid-cols-5'>
            <Card>
              <CardContent className='p-4 text-center'>
                <p className='text-2xl font-bold'>{plural('producto', stats.total_productos)}</p>
                <p className='text-sm text-muted-foreground'>Compatibles</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4 text-center'>
                <p className='text-2xl font-bold'>{plural('instalación', stats.total_instalaciones)}</p>
                <p className='text-sm text-muted-foreground'>Cliente-equipo</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4 text-center'>
                <p className='text-2xl font-bold'>{stats.uso_total.toLocaleString('es-MX')}</p>
                <p className='text-sm text-muted-foreground'>Usos totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4 text-center'>
                <p className='text-2xl font-bold'>{stats.uso_promedio.toLocaleString('es-MX')}</p>
                <p className='text-sm text-muted-foreground'>Usos promedio</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4 text-center'>
                <p className='text-2xl font-bold'>{plural('movimiento', stats.total_movimientos)}</p>
                <p className='text-sm text-muted-foreground'>Total</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className='-mx-6 flex-1 overflow-y-auto px-6'>
          <section>
            <h3 className='mb-4 text-lg font-semibold'>Productos compatibles</h3>
            {productosLoading ? (
              <div className='flex items-center justify-center py-16'>
                <Loader2 className='size-6 animate-spin text-muted-foreground' />
              </div>
            ) : productos.length > 0 ? (
              <DataTable
                columns={columns}
                data={productos}
                emptyComponent={
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No hay productos vinculados</EmptyTitle>
                      <EmptyDescription>
                        Este equipo no tiene productos compatibles registrados.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                }
              />
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No hay productos vinculados</EmptyTitle>
                  <EmptyDescription>
                    Este equipo no tiene productos compatibles registrados.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </section>

          <Separator className='my-6' />

          <section>
            <h3 className='mb-4 text-lg font-semibold'>Clientes</h3>
            {clientesLoading ? (
              <div className='flex items-center justify-center py-16'>
                <Loader2 className='size-6 animate-spin text-muted-foreground' />
              </div>
            ) : clientes.length > 0 ? (
              <DataTable
                columns={clienteColumns}
                data={clientes}
                emptyComponent={
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No hay clientes vinculados</EmptyTitle>
                      <EmptyDescription>Este equipo no tiene clientes registrados.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                }
              />
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No hay clientes vinculados</EmptyTitle>
                  <EmptyDescription>Este equipo no tiene clientes registrados.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
