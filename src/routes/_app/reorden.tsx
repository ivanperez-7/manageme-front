import { createFileRoute, Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Download, Info, Package2, Plus, Truck } from 'lucide-react';
import { useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { DataTable } from '@/components/data-table';
import { ReordenSkeleton } from '@/components/route-skeletons';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { ENDPOINTS } from '@/api/endpoints';
import { fetchReorden } from '@/api/reorden';
import { downloadBlob } from '@/lib/download-blob';
import type { ReordenProducto, ReordenProveedor } from '@/lib/types';
import { cn } from '@/lib/utils';

const columns: ColumnDef<ReordenProducto>[] = [
  {
    accessorKey: 'codigo_interno',
    header: 'Código',
    cell: ({ row }) => (
      <Link
        to='/catalogo/$id'
        params={{ id: row.original.producto_id.toString() }}
        className='font-bold'
      >
        {row.original.codigo_interno}
      </Link>
    ),
  },
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
    cell: ({ row }) => (
      <span className='max-w-[200px] truncate block' title={row.original.descripcion}>
        {row.original.descripcion}
      </span>
    ),
  },
  {
    accessorKey: 'cantidad_disponible',
    header: () => <span className='text-right block'>Disponible</span>,
    cell: ({ row }) => {
      const isCritical = row.original.cantidad_disponible < row.original.min_stock;
      return (
        <span
          className={cn(
            'text-right block',
            isCritical && 'text-red-600 dark:text-red-400 font-semibold'
          )}
        >
          {row.original.cantidad_disponible}
        </span>
      );
    },
  },
  {
    accessorKey: 'min_stock',
    header: () => <span className='text-right block'>Mínimo</span>,
    cell: ({ row }) => <span className='text-right block'>{row.original.min_stock}</span>,
  },
  {
    accessorKey: 'consumo_mensual',
    header: () => <span className='text-right block'>Consumo/mes</span>,
    cell: ({ row }) => (
      <span className='text-right block'>
        {row.original.consumo_mensual !== null ? row.original.consumo_mensual.toFixed(1) : '—'}
      </span>
    ),
  },
  {
    accessorKey: 'dias_cobertura',
    header: () => <span className='text-right block'>Cobertura</span>,
    cell: ({ row }) => {
      const { dias_cobertura } = row.original;
      if (dias_cobertura === null) {
        return (
          <div className='text-right'>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant='outline' className='text-xs'>
                  Sin datos
                </Badge>
              </TooltipTrigger>
              <TooltipContent>No hay historial de consumo para este producto</TooltipContent>
            </Tooltip>
          </div>
        );
      }
      const isWarning = dias_cobertura < 30;
      return (
        <span
          className={cn(
            'text-right block',
            isWarning && 'text-amber-600 dark:text-amber-400 font-semibold'
          )}
        >
          {dias_cobertura} días
        </span>
      );
    },
  },
  {
    id: 'cantidad_sugerida',
    header: () => <span className='text-right block'>Sugerido</span>,
    cell: ({ row }) => (
      <span className='text-right font-semibold block'>
        {row.original.cantidad_sugerida > 0 ? row.original.cantidad_sugerida : '—'}
      </span>
    ),
  },
];

export const Route = createFileRoute('/_app/reorden')({
  staticData: { headerBreadcrumb: [{ label: 'Reorden' }] },
  loader: fetchReorden,
  component: ReordenPage,
  pendingComponent: ReordenSkeleton,
  pendingMs: 200,
  errorComponent: ErrorState,
  staleTime: 30_000,
});

function ReordenPage() {
  const data = Route.useLoaderData();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const totalProductos = data.reduce((acc, p) => acc + p.productos.length, 0);
  const totalSugerido = data.reduce(
    (acc, p) => acc + p.productos.reduce((s, q) => s + q.cantidad_sugerida, 0),
    0
  );

  const downloadReorden = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    await downloadBlob(ENDPOINTS.reorden.exportReorden, 'reorden.xlsx');
    setIsDownloading(false);
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-1'>
          <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>Pedidos sugeridos</h1>
          <p className='text-muted-foreground'>
            Sugerencias de reabastecimiento agrupadas por proveedor.
          </p>
        </div>
        <Button
          variant='outline'
          size='sm'
          className='shrink-0'
          onClick={downloadReorden}
          disabled={isDownloading}
        >
          {isDownloading ? <Spinner /> : <Download className='h-4 w-4' />}
          Exportar
        </Button>
      </div>

      <div
        className='my-6 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400 cursor-pointer select-none'
        onClick={() => setShowInfo((prev) => !prev)}
        role='button'
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowInfo((prev) => !prev)}
      >
        <Info className='size-4 shrink-0 mt-0.5' />
        <div className='flex-1 space-y-2'>
          <p>
            Las sugerencias se basan en el <strong>consumo promedio mensual histórico</strong> de cada
            producto (salidas aprobadas en los últimos N meses ÷ N).
          </p>
          <AnimatePresence initial={false}>
            {showInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className='overflow-hidden'
              >
                <div className='space-y-2 pt-2'>
                  <p>
                    Se sugiere reordenar cuando el stock disponible es menor al mínimo, o cuando los{' '}
                    <strong>días de cobertura</strong> (stock ÷ consumo diario estimado) son
                    insuficientes para cubrir el tiempo de entrega del proveedor.
                  </p>
                  <p>
                    La cantidad sugerida se calcula como:{' '}
                    <code className='bg-muted px-1.5 py-0.5 rounded text-xs'>
                      consumo_mensual × meses_objetivo − cantidad_disponible
                    </code>
                  </p>
                  <p>
                    Los parámetros (<em>lead time</em>, meses objetivo, meses de historial) se pueden
                    ajustar desde{' '}
                    <Link to='/settings' className='font-medium underline underline-offset-2'>
                      Configuración
                    </Link>
                    .
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 mt-0.5 transition-transform duration-200',
            showInfo && 'rotate-180'
          )}
        />
      </div>

      <div className='grid md:grid-cols-3 gap-4'>
        <SummaryCard
          label='Productos'
          value={totalProductos}
          description='Por reordenar'
          icon={<Package2 className='size-4 text-chart-3' />}
          color='bg-chart-3'
        />
        <SummaryCard
          label='Proveedores'
          value={data.length}
          description='Con sugerencias'
          icon={<Truck className='size-4 text-chart-1' />}
          color='bg-chart-1'
        />
        <SummaryCard
          label='Unidades'
          value={totalSugerido}
          description='Sugeridas en total'
          icon={<Plus className='size-4 text-chart-2' />}
          color='bg-chart-2'
        />
      </div>

      <Accordion type='multiple' className='space-y-3'>
        {data.map((proveedor) => (
          <ProveedorSection key={proveedor.proveedor_id} proveedor={proveedor} />
        ))}
      </Accordion>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
  color,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className='relative overflow-hidden'>
      <div className={`absolute top-0 left-0 w-full h-0.5 ${color}`} />
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-sm font-medium'>{label}</CardTitle>
        <div className={`size-9 rounded-lg ${color}/10 flex items-center justify-center`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </CardContent>
    </Card>
  );
}

function ProveedorSection({ proveedor }: { proveedor: ReordenProveedor }) {
  const totalSugerido = proveedor.productos.reduce((s, p) => s + p.cantidad_sugerida, 0);
  const enRiesgo = proveedor.productos.filter((p) => p.cantidad_disponible < p.min_stock).length;

  return (
    <AccordionItem value={String(proveedor.proveedor_id)} className='border rounded-lg px-4 bg-card'>
      <AccordionTrigger className='hover:no-underline'>
        <div className='flex items-center gap-3 flex-1 min-w-0'>
          <span className='font-semibold truncate'>{proveedor.proveedor_nombre}</span>
          <Badge variant='secondary' className='shrink-0'>
            {proveedor.productos.length} productos
          </Badge>
          {enRiesgo > 0 && (
            <Badge variant='destructive' className='shrink-0'>
              {enRiesgo} crítico{enRiesgo > 1 ? 's' : ''}
            </Badge>
          )}
          <span className='text-sm text-muted-foreground shrink-0 ml-auto'>
            Sugerido: <strong>{totalSugerido}</strong> uds
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <DataTable
          columns={columns}
          data={proveedor.productos}
          transparent
          getRowClassName={(row) =>
            cn(
              row.cantidad_disponible < row.min_stock &&
                'bg-red-50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-900/30 even:bg-red-50/80 dark:even:bg-red-950/10',
              row.cantidad_disponible >= row.min_stock &&
                row.dias_cobertura !== null &&
                row.dias_cobertura < 30 &&
                'bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 even:bg-amber-50/80 dark:even:bg-amber-950/10'
            )
          }
        />
      </AccordionContent>
    </AccordionItem>
  );
}
