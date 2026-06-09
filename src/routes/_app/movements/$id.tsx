import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, ErrorComponent, Link, useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDate } from 'date-fns';
import { ArrowLeft, CheckCircle, Download, Info, PackageOpen, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table';
import { MovementDetailSkeleton } from '@/components/route-skeletons';
import TipoMovimientoBadge from '@/components/tipo-movimiento-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import UserTag from '@/components/user-tag';

import { ENDPOINTS } from '@/api/endpoints';
import { fetchMovimientoById } from '@/api/movimientos';
import { downloadBlob } from '@/lib/download-blob';
import { withAuth } from '@/lib/auth';
import type { MovimientoItemResponse } from '@/lib/types';
import { firstUpperCase, humanDate, humanTime } from '@/lib/utils';
import { userStore } from '@/stores/userStore';

const makeColumns = (tipo: 'entrada' | 'salida'): ColumnDef<MovimientoItemResponse>[] => {
  const base: ColumnDef<MovimientoItemResponse>[] = [
    {
      header: 'Producto',
      cell: ({ row }) => (
        <Link
          to='/catalogo/$id'
          params={{ id: String(row.original.producto.id) }}
          className='font-medium'
        >
          {row.original.producto.codigo_interno}
        </Link>
      ),
    },
    { accessorKey: 'producto.descripcion', header: 'Descripción' },
    { accessorKey: 'lote.codigo_lote', header: 'Código de lote asociado' },
    {
      header: 'Cantidad',
      cell: ({ row }) => row.original.cantidad.toLocaleString('es-MX'),
    },
  ];

  if (tipo === 'salida') {
    base.push(
      {
        header: 'Ant.',
        cell: ({ row }) =>
          row.original.cambio_anticipado ? (
            <span className='text-green-600 font-medium'>✓</span>
          ) : (
            <span className='text-muted-foreground'>—</span>
          ),
      },
      {
        header: 'Motivo',
        cell: ({ row }) =>
          row.original.motivo_cambio ?? <span className='text-muted-foreground'>—</span>,
      }
    );
  }

  return base;
};

type Search = { itemsPage?: number };
type MovimientoLoaderData = Awaited<ReturnType<typeof fetchMovimientoById>>;

export const Route = createFileRoute('/_app/movements/$id')({
  staticData: {
    headerBreadcrumb: (match) => {
      const data = match.loaderData as MovimientoLoaderData | undefined;
      return [
        { label: 'Movimientos', to: '/movements' },
        {
          label: data ? `${data.tipo === 'entrada' ? 'Entrada' : 'Salida'} #${data.id}` : '...',
        },
      ];
    },
  },
  validateSearch: ({ itemsPage }): Search => ({
    itemsPage: itemsPage != null ? Number(itemsPage) : undefined,
  }),
  loader: async ({ params }) => await fetchMovimientoById(params.id),
  component: MovementDetailPage,
  pendingComponent: MovementDetailSkeleton,
  pendingMs: 200,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

function MovementDetailPage() {
  const [isDownloading, setIsDownloading] = useState(false);

  const movimiento = Route.useLoaderData();
  const { itemsPage } = Route.useSearch();
  const router = useRouter();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const detalleEntrada = movimiento.detalle_entrada;
  const detalleSalida = movimiento.detalle_salida;
  const hasAnticipado = movimiento.items.some((i) => i.cambio_anticipado);

  const approveMutation = useMutation({
    mutationFn: () => withAuth.post(ENDPOINTS.movimientos.detail(movimiento.id) + 'aprobar/'),
    onSuccess: () => {
      router.invalidate();
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      toast.success(`${firstUpperCase(movimiento.tipo)} aprobada exitosamente`);
    },
    onError: (err: any) =>
      toast.error(
        `No se pudo aprobar la ${movimiento.tipo}. ` + (err.response?.data?.detail || err.message)
      ),
  });

  const downloadEtiquetas = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    await downloadBlob(
      ENDPOINTS.movimientos.etiquetas(movimiento.id),
      `etiquetas-entrada-${movimiento.id}.pdf`
    );
    setIsDownloading(false);
  };

  return (
    <>
      {/* HEADER */}
      <header className='grid md:flex justify-between items-center'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' onClick={() => router.history.back()}>
            <ArrowLeft className='h-4 w-4' />
          </Button>

          <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>
            {movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'} #{movimiento.id}
          </h1>
        </div>
      </header>

      {hasAnticipado && (
        <div className='my-6 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400'>
          <Info className='size-4 shrink-0' />
          <span>
            Este movimiento contiene productos marcados como cambio anticipado. Revisar detenidamente.
          </span>
        </div>
      )}

      {/* INFORMACIÓN GENERAL */}
      <Card className='my-6'>
        <CardHeader>
          <CardTitle className='text-lg'>Información General</CardTitle>
          <Separator />
        </CardHeader>

        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='space-y-4'>
              {/* Tipo */}
              <div>
                <p className='text-sm text-muted-foreground'>Tipo de movimiento</p>
                <TipoMovimientoBadge tipo={movimiento.tipo} />
              </div>

              {/* Fecha */}
              <div>
                <p className='text-sm text-muted-foreground'>Fecha</p>
                <p>
                  {humanDate(movimiento.creado)} {humanTime(movimiento.creado)}
                </p>
              </div>

              {/* Creador */}
              <div>
                <p className='text-sm text-muted-foreground'>Creado por</p>
                <UserTag username={movimiento.creado_por.full_name} />
              </div>
            </div>

            {/* Aprobación */}
            <div className='space-y-4'>
              <div>
                <p className='text-sm text-muted-foreground'>¿Aprobado?</p>
                {movimiento.aprobado ? (
                  <div className='flex items-end'>
                    <span className='flex items-center gap-2 text-green-600 dark:text-green-400'>
                      <CheckCircle className='h-4 w-4' /> Sí
                    </span>
                    <span className='ml-4 text-sm text-muted-foreground'>
                      {formatDate(new Date(movimiento.aprobado_fecha as string), 'dd/MM/yyyy HH:mm')}{' '}
                      por {movimiento.user_aprueba?.full_name || '—'}
                    </span>

                    {movimiento.tipo === 'entrada' && (
                      <Button
                        variant='outline'
                        size='sm'
                        className='ml-4'
                        onClick={downloadEtiquetas}
                        disabled={isDownloading}
                      >
                        {isDownloading ? <Spinner /> : <Download className='h-4 w-4' />}
                        Etiquetas
                      </Button>
                    )}
                  </div>
                ) : (
                  <span className='flex items-center gap-2 text-red-600 dark:text-red-400'>
                    <XCircle className='h-4 w-4' /> No aprobado
                    {userStore.state.profile?.rol === 'admin' && (
                      <Button
                        variant='secondary'
                        className='text-sm ml-3'
                        size='sm'
                        onClick={() => approveMutation.mutate()}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending && <Spinner />} Aprobar
                      </Button>
                    )}
                  </span>
                )}
              </div>

              {movimiento.comentarios && (
                <div>
                  <p className='text-sm text-muted-foreground'>Comentarios</p>
                  <p>{movimiento.comentarios}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DETALLE ENTRADA */}
      {movimiento.tipo === 'entrada' && detalleEntrada && (
        <Card className='my-6'>
          <CardHeader>
            <CardTitle className='text-lg'>Datos de la entrada</CardTitle>
            <Separator />
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2'>
              <span>
                <p className='text-sm text-muted-foreground'>Número de factura</p>{' '}
                {detalleEntrada.numero_factura || '—'}
              </span>
              <span>
                <p className='text-sm text-muted-foreground'>Recibido por</p>{' '}
                <UserTag username={detalleEntrada.recibido_por.full_name} />
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DETALLE SALIDA */}
      {movimiento.tipo === 'salida' && detalleSalida && (
        <Card className='my-6'>
          <CardHeader>
            <CardTitle className='text-lg'>Datos de la salida</CardTitle>
            <Separator />
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <span>
                <p className='text-sm text-muted-foreground'>Cliente</p>{' '}
                <Link to='/clients/$id' params={{ id: String(detalleSalida.cliente.id) }}>
                  {detalleSalida.cliente.nombre}
                </Link>
              </span>
              <span>
                <p className='text-sm text-muted-foreground'>Tipo de salida</p>{' '}
                {detalleSalida.subtipo === 'venta' ? 'Venta' : 'Renta'}
              </span>
              <span>
                <p className='text-sm text-muted-foreground'>Técnico</p> {detalleSalida.tecnico || '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ITEMS */}
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle className='text-lg'>Productos del movimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={movimiento.items}
            columns={makeColumns(movimiento.tipo)}
            transparent
            initialPage={itemsPage ?? 0}
            onChangePage={(pageIndex) =>
              navigate({
                search: (prev) => ({ ...prev, itemsPage: pageIndex }),
                replace: true,
                resetScroll: false,
              })
            }
            emptyComponent={
              <Empty className='my-0 py-0'>
                <EmptyHeader>
                  <EmptyMedia variant='decorative'>
                    <PackageOpen />
                  </EmptyMedia>
                  <EmptyTitle>No hay productos</EmptyTitle>
                </EmptyHeader>
              </Empty>
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
