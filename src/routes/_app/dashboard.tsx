import { createFileRoute, ErrorComponent, Link, useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { Layers, Package2, Truck, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { DataTable } from '@/components/data-table';
import { DeficitProgress } from '@/components/deficit-progress';
import { DashboardSkeleton } from '@/components/route-skeletons';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import { getDashboardData } from '@/api/dashboard';
import type { DashboardData } from '@/lib/types';

const lowStockColumns: ColumnDef<DashboardData['productosBajos'][0]>[] = [
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
    cell: ({ row }) => (
      <Link to='/catalogo/$id' params={{ id: row.original.id.toString() }}>
        {row.original.descripcion}
      </Link>
    ),
  },
  { accessorKey: 'categoria__nombre', header: 'Categoría' },
  {
    header: 'Stock',
    cell: ({ row }) => (
      <DeficitProgress value={row.original.cantidad_disponible} minRequired={row.original.min_stock} />
    ),
  },
];

export const Route = createFileRoute('/_app/dashboard')({
  staticData: { headerBreadcrumb: [{ label: 'Dashboard' }] },
  loader: getDashboardData,
  component: DashboardPage,
  pendingComponent: DashboardSkeleton,
  pendingMs: 200,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

function DashboardPage() {
  const { stats, categoriasChart, movimientosChart, productosBajos, topProductosChart } =
    Route.useLoaderData();
  const router = useRouter();

  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-semibold tracking-tight'>Dashboard</h1>
        <p className='text-muted-foreground'>Resumen general del inventario.</p>
      </div>
      <motion.div
        className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'
        initial='hidden'
        animate='visible'
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <Card className='relative overflow-hidden'>
            <div className='absolute top-0 left-0 w-full h-0.5 bg-chart-3' />
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>Productos</CardTitle>
              <div className='size-9 rounded-lg bg-chart-3/10 flex items-center justify-center'>
                <Package2 className='size-4 text-chart-3' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.productos}</div>
              <p className='text-xs text-muted-foreground'>Total en catálogo</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <Card className='relative overflow-hidden'>
            <div className='absolute top-0 left-0 w-full h-0.5 bg-chart-2' />
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>Lotes</CardTitle>
              <div className='size-9 rounded-lg bg-chart-2/10 flex items-center justify-center'>
                <Layers className='size-4 text-chart-2' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.lotes}</div>
              <p className='text-xs text-muted-foreground'>Lotes registrados</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <Card className='relative overflow-hidden'>
            <div className='absolute top-0 left-0 w-full h-0.5 bg-chart-1' />
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>Clientes</CardTitle>
              <div className='size-9 rounded-lg bg-chart-1/10 flex items-center justify-center'>
                <Users className='size-4 text-chart-1' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.clientes}</div>
              <p className='text-xs text-muted-foreground'>Clientes activos</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <Card className='relative overflow-hidden'>
            <div className='absolute top-0 left-0 w-full h-0.5 bg-chart-5' />
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>Proveedores</CardTitle>
              <div className='size-9 rounded-lg bg-chart-5/10 flex items-center justify-center'>
                <Truck className='size-4 text-chart-5' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.proveedores}</div>
              <p className='text-xs text-muted-foreground'>Proveedores registrados</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        className='grid lg:grid-cols-2 gap-6'
        initial='hidden'
        animate='visible'
        variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}>
          <Card>
            <CardHeader>
              <CardTitle>Productos por categoría</CardTitle>
            </CardHeader>
            <CardContent className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={categoriasChart}>
                  <XAxis dataKey='nombre' />
                  <YAxis />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)', stroke: 'var(--border)' }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                    }}
                  />
                  <Bar dataKey='cantidad' fill='#3b82f6' />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}>
          <Card>
            <CardHeader>
              <CardTitle>Productos con más movimientos en los últimos 30 días</CardTitle>
            </CardHeader>
            <CardContent className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={topProductosChart}>
                  <XAxis dataKey='codigo_interno' />
                  <YAxis />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)', stroke: 'var(--border)' }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                    }}
                  />
                  <Bar
                    dataKey='total_movimientos'
                    fill='#10b981'
                    onClick={(data) => {
                      const producto = data.payload as DashboardData['topProductosChart'][0];
                      router.navigate({ to: '/catalogo/$id', params: { id: producto.id.toString() } });
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
            <CardFooter>
              <p className='text-sm text-muted-foreground'>
                Haga clic en una barra para ver los detalles del producto.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        className='grid lg:grid-cols-2 gap-6'
        initial='hidden'
        animate='visible'
        variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } } }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}>
          <Card>
            <CardHeader>
              <CardTitle>Movimientos en los últimos 30 días</CardTitle>
            </CardHeader>
            <CardContent className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={movimientosChart}>
                  <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
                  <XAxis dataKey='fecha_creado' />
                  <YAxis />
                  <Legend />
                  <Tooltip
                    cursor={{ stroke: 'var(--border)' }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                    }}
                  />
                  <Line type='monotone' dataKey='entradas' stroke='#3b82f6' strokeWidth={2} />
                  <Line type='monotone' dataKey='salidas' stroke='#10b981' strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}>
          <Card>
            <CardHeader>
              <CardTitle>Productos con bajo inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable transparent data={productosBajos} columns={lowStockColumns} />
            </CardContent>
            <CardFooter>
              <p className='text-sm text-muted-foreground'>
                Haga clic en un producto para ver los detalles de este.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
