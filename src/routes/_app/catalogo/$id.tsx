import { createFileRoute, ErrorComponent, Link, useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  ArrowDownToDot,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpFromDot,
  CheckCircle,
  Edit,
  Loader2,
  PackageOpen,
  Trash,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// COMPONENTES DEL PROYECTO
import { AddMovementDialog } from '@/components/add-movement-dialog';
import { AddProductDialog } from '@/components/add-product-dialog';
import { DataTable } from '@/components/data-table';
import { DateRangePicker } from '@/components/date-range-pickers';
import { DeleteProductDialog } from '@/components/delete-product-dialog';
import { RemainingProgress } from '@/components/remaining-progress';
import { ProductDetailSkeleton } from '@/components/route-skeletons';
import { useHeader } from '@/components/site-header';
import TipoMovimientoBadge from '@/components/tipo-movimiento-badge';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// OTRAS UTILIDADES
import { fetchProductoById } from '@/api/catalogo';
import { fetchMovimientos } from '@/api/movimientos';
import type { LoteResponse, MovimientoResponse, ProductoResponse, ProveedorResponse } from '@/lib/types';
import { cn, humanDate, humanTime, plural } from '@/lib/utils';

const movementsColumns: ColumnDef<MovimientoResponse & { cantidad: number }>[] = [
  {
    accessorKey: 'id',
    header: 'Folio',
    cell: ({ row }) => (
      <Link to='/movements/$id' params={{ id: String(row.original.id) }} className='font-semibold'>
        {row.getValue('id')}
      </Link>
    ),
  },
  {
    accessorKey: 'creado',
    header: 'Fecha',
    cell: ({ row }) => humanDate(row.getValue('creado')),
  },
  {
    id: 'hora',
    accessorKey: 'creado',
    header: 'Hora',
    cell: ({ row }) => humanTime(row.getValue('creado')),
  },
  {
    id: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => <TipoMovimientoBadge tipo={row.original.tipo} />,
  },
  {
    accessorKey: 'cantidad',
    header: 'Cantidad',
    cell: ({ row }) => (
      <span
        className={cn(
          row.original.tipo === 'entrada'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-red-600 dark:text-red-400',
          'font-semibold'
        )}
      >
        {row.original.cantidad.toLocaleString('es-MX')}
      </span>
    ),
  },
  {
    accessorKey: 'aprobado',
    header: '¿Aprobado?',
    cell: ({ row }) =>
      row.getValue('aprobado') && (
        <div className='flex gap-1.5 items-center'>
          <CheckCircle className='size-4 text-green-700 dark:text-green-400' />{' '}
          <span className='text-muted-foreground'>{row.original.user_aprueba?.full_name}</span>
        </div>
      ),
  },
];

const lotesColumns: ColumnDef<LoteResponse>[] = [
  { accessorKey: 'codigo_lote', header: 'Código' },
  {
    accessorKey: 'cantidad_restante',
    header: 'Cantidad restante',
    cell: ({ row }) => (
      <RemainingProgress total={row.original.cantidad_inicial} remaining={row.original.cantidad_restante} />
    ),
  },
  {
    accessorKey: 'fecha_entrada',
    header: 'Fecha de entrada',
    cell: ({ row }) => humanDate(row.getValue('fecha_entrada')),
  },
  {
    id: 'hora_entrada',
    accessorKey: 'fecha_entrada',
    header: 'Hora de entrada',
    cell: ({ row }) => humanTime(row.getValue('fecha_entrada')),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Tooltip>
        <AddMovementDialog
          trigger={
            <TooltipTrigger asChild>
              <Button variant='secondary' size='sm'>
                <ArrowUpFromDot />
              </Button>
            </TooltipTrigger>
          }
          initialData={{
            tipo: 'salida',
            items: [{ producto_id: row.original.producto.id, cantidad: 0, lote_id: row.original.id }],
          }}
        />
        <TooltipContent>Registrar salida</TooltipContent>
      </Tooltip>
    ),
  },
];

type MovimientoSearch = { fechaInicio?: string; fechaFin?: string };

export const Route = createFileRoute('/_app/catalogo/$id')({
  validateSearch: ({ fechaInicio, fechaFin }): MovimientoSearch => ({
    fechaInicio: (fechaInicio as string) || undefined,
    fechaFin: (fechaFin as string) || undefined,
  }),
  loader: async ({ params }) => await fetchProductoById(params.id),
  component: ProductDetailPage,
  pendingComponent: ProductDetailSkeleton,
  pendingMs: 200,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

function ProductDetailPage() {
  const { producto, lotes } = Route.useLoaderData();
  const { setContent } = useHeader();
  const router = useRouter();

  useEffect(() => {
    setContent(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to='/catalogo'>Productos</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{producto.codigo_interno}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    return () => setContent(null);
  }, []);

  return (
    <>
      {/* Header con título y botones de editar y eliminar */}
      <header className='grid md:flex justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' onClick={() => router.history.back()}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <h1 className='text-3xl font-semibold tracking-tight'>{producto.descripcion}</h1>
        </div>

        <div className='space-x-2'>
          <AddProductDialog
            trigger={
              <Button variant='ghost'>
                <Edit className='h-4 w-4' />
                Editar
              </Button>
            }
            producto={producto}
          />
          <DeleteProductDialog
            trigger={
              <Button variant='destructive'>
                <Trash className='h-4 w-4' />
              </Button>
            }
            productId={producto.id}
          />
        </div>
      </header>

      <ProductInfoCard producto={producto} />
      <ProductProviderCard proveedor={producto.proveedor} />
      <ProductBatchesCard lotes={lotes} />
      <ProductMovementsCard />
    </>
  );
}

const ProductInfoCard = ({ producto }: { producto: ProductoResponse }) => (
  <Card className='my-6'>
    <CardHeader>
      <CardTitle className='text-lg'>Información General</CardTitle>
      <Separator />
    </CardHeader>
    <CardContent>
      <div className='grid grid-cols-2 gap-8'>
        <div className='space-y-4'>
          <div>
            <p className='text-sm text-muted-foreground'>Código</p>
            <p className='font-semibold'>{producto.codigo_interno}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Categoría</p>
            <p>{producto.categoria?.nombre}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>SKU</p>
            <p>{producto.sku}</p>
          </div>
        </div>
        <div className='space-y-4'>
          <div>
            <p className='text-sm text-muted-foreground'>Existencia</p>
            <p>{plural('unidad', producto.cantidad_disponible)}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Vida útil</p>
            <p>{plural('unidad', producto.vida_util)}</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground '>Equipos compatibles</p>
            {producto.equipos?.length > 0 ? (
              <div className='flex flex-wrap gap-2 mt-2'>
                {producto.equipos.map((eq) => (
                  <Badge key={eq.id} variant='secondary' className='px-3 py-1 gap-2'>
                    {eq.nombre} <span className='text-xs text-muted-foreground'>{eq.marca.nombre}</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <p>N/A</p>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ProductProviderCard = ({ proveedor }: { proveedor?: ProveedorResponse }) =>
  proveedor && (
    <Card className='my-6'>
      <CardHeader>
        <CardTitle className='text-lg'>Proveedor de este producto</CardTitle>
        <Separator />
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-8'>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Razón social</p>
              <p className='font-semibold'>{proveedor.nombre}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Nombre de contacto</p>
              <p className='font-semibold'>{proveedor.nombre_contacto}</p>
            </div>
          </div>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Teléfono</p>
              <p className='font-semibold'>{proveedor.telefono || 'N/A'}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Correo</p>
              <a className='font-semibold' href={'mailto:' + proveedor.correo}>
                {proveedor.correo || 'N/A'}
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

const ProductBatchesCard = ({ lotes }: { lotes: LoteResponse[] }) => {
  const [showEmpty, setShowEmpty] = useState(false);

  const filteredLotes = useMemo(
    () => (showEmpty ? lotes : lotes.filter((lote) => lote.cantidad_restante > 0)),
    [showEmpty, lotes]
  );

  return (
    <Card className='mb-6'>
      <CardHeader className='grid items-center md:flex md:justify-between'>
        <CardTitle className='text-lg'>Lotes en el almacén</CardTitle>
        <div className='flex items-center gap-3'>
          <Checkbox id='checkbox' checked={showEmpty} onCheckedChange={(val) => setShowEmpty(!!val)} />
          <Label htmlFor='checkbox'>Mostrar lotes agotados</Label>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          data={filteredLotes}
          columns={lotesColumns}
          transparent
          emptyComponent={
            <Empty className='my-0 py-0'>
              <EmptyHeader>
                <EmptyMedia variant='decorative'>
                  <PackageOpen />
                </EmptyMedia>
                <EmptyTitle>No se ha registrado ningún lote</EmptyTitle>
                <EmptyDescription>Comienza registrando un lote por medio de una entrada</EmptyDescription>
              </EmptyHeader>
            </Empty>
          }
        />
      </CardContent>
    </Card>
  );
};

const ProductMovementsCard = () => {
  const { producto, lotes } = Route.useLoaderData();
  const { fechaInicio, fechaFin } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [movimientos, setMovimientos] = useState<MovimientoResponse[]>([]);
  const [oldestDate, setOldestDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    fetchMovimientos({
      productoId: producto.id,
      fechaInicio: fechaInicio || format(new Date(), 'yyyy-MM-dd'),
      fechaFin: fechaFin || format(new Date(), 'yyyy-MM-dd'),
    }).then(({ movimientos: data, oldestDate: od }) => {
      if (!ignore) {
        setMovimientos(data);
        setOldestDate(od);
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [fechaInicio, fechaFin, producto.id, lotes]);

  return (
    <Card className='mb-6'>
      <CardHeader className='grid items-center md:flex md:justify-between'>
        <CardTitle className='text-lg'>Movimientos</CardTitle>
        <div className='grid md:flex gap-3'>
          <AddMovementDialog
            trigger={
              <Button size='sm'>
                <ArrowDownToDot />
                Registrar entrada
              </Button>
            }
            initialData={{
              tipo: 'entrada',
              items: [{ producto_id: producto.id, cantidad: 0 }],
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <DateRangePicker
          minDate={oldestDate ? new Date(oldestDate) : undefined}
          defaultStartDate={fechaInicio ? new Date(fechaInicio) : undefined}
          defaultEndDate={fechaFin ? new Date(fechaFin) : undefined}
          onStartDateChange={(date) =>
            navigate({
              search: (prev) => ({ ...prev, fechaInicio: format(date, 'yyyy-MM-dd') }),
              replace: true,
              resetScroll: false,
            })
          }
          onEndDateChange={(date) =>
            navigate({
              search: (prev) => ({ ...prev, fechaFin: format(date, 'yyyy-MM-dd') }),
              replace: true,
              resetScroll: false,
            })
          }
          className='mb-3'
        />

        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='size-6 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <DataTable
            data={movimientos.flatMap((mov) =>
              mov.items
                .filter((item) => item.producto.id == producto.id)
                .map((item) => ({ cantidad: item.cantidad, ...mov }))
            )}
            columns={movementsColumns}
            transparent
            emptyComponent={
              <Empty className='my-0 py-0'>
                <EmptyHeader>
                  <EmptyMedia variant='decorative'>
                    <ArrowLeftRight />
                  </EmptyMedia>
                  <EmptyTitle>No se ha hecho ningún movimiento</EmptyTitle>
                  <EmptyDescription>
                    Comienza registrando una entrada o salida de este producto
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            }
          />
        )}
      </CardContent>
    </Card>
  );
};
