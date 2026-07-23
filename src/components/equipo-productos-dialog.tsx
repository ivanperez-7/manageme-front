import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { DataTable } from './data-table';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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
      <DialogContent className='flex max-h-[80vh] flex-col md:max-w-4xl lg:max-w-6xl'>
        <DialogHeader>
          <DialogTitle className='truncate'>
            {equipo.nombre}{' '}
            <span className='text-muted-foreground ml-2 text-sm'>{equipo.marca.nombre}</span>
          </DialogTitle>
        </DialogHeader>

        {statsLoading ? (
          <div role='status' aria-busy='true' className='flex items-center justify-center py-4'>
            <Loader2 className='size-6 animate-spin text-muted-foreground' />
            <span className='sr-only'>Cargando estadísticas...</span>
          </div>
        ) : stats ? (
          <div className='-mx-6 mb-4 grid grid-cols-2 gap-3 px-6 sm:grid-cols-3 lg:grid-cols-5'>
            <Card>
              <CardHeader className='p-4 pb-0 text-center'>
                <CardTitle className='text-2xl font-bold'>
                  {plural('producto', stats.total_productos)}
                </CardTitle>
              </CardHeader>
              <CardContent className='p-4 pt-0 text-center'>
                <p className='text-sm text-muted-foreground'>Compatibles</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='p-4 pb-0 text-center'>
                <CardTitle className='text-2xl font-bold'>
                  {plural('instalación', stats.total_instalaciones)}
                </CardTitle>
              </CardHeader>
              <CardContent className='p-4 pt-0 text-center'>
                <p className='text-sm text-muted-foreground'>Cliente-equipo</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='p-4 pb-0 text-center'>
                <CardTitle className='text-2xl font-bold'>
                  {stats.uso_total.toLocaleString('es-MX')}
                </CardTitle>
              </CardHeader>
              <CardContent className='p-4 pt-0 text-center'>
                <p className='text-sm text-muted-foreground'>Usos totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='p-4 pb-0 text-center'>
                <CardTitle className='text-2xl font-bold'>
                  {stats.uso_promedio.toLocaleString('es-MX')}
                </CardTitle>
              </CardHeader>
              <CardContent className='p-4 pt-0 text-center'>
                <p className='text-sm text-muted-foreground'>Usos promedio</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='p-4 pb-0 text-center'>
                <CardTitle className='text-2xl font-bold'>
                  {plural('movimiento', stats.total_movimientos)}
                </CardTitle>
              </CardHeader>
              <CardContent className='p-4 pt-0 text-center'>
                <p className='text-sm text-muted-foreground'>Total</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <ScrollArea className='-mx-6 flex-1 px-6'>
          <Tabs defaultValue='productos'>
            <TabsList className='mb-4'>
              <TabsTrigger value='productos'>Productos compatibles</TabsTrigger>
              <TabsTrigger value='clientes'>Clientes</TabsTrigger>
            </TabsList>

            <TabsContent value='productos'>
              {productosLoading ? (
                <div role='status' aria-busy='true' className='flex items-center justify-center py-16'>
                  <Loader2 className='size-6 animate-spin text-muted-foreground' />
                  <span className='sr-only'>Cargando productos...</span>
                </div>
              ) : (
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
              )}
            </TabsContent>

            <TabsContent value='clientes'>
              {clientesLoading ? (
                <div role='status' aria-busy='true' className='flex items-center justify-center py-16'>
                  <Loader2 className='size-6 animate-spin text-muted-foreground' />
                  <span className='sr-only'>Cargando clientes...</span>
                </div>
              ) : (
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
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
