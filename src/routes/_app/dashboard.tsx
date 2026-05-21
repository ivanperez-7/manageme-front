import { createFileRoute, ErrorComponent, Link, useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useEffect } from 'react';
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
import { useHeader } from '@/components/site-header';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
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
  loader: getDashboardData,
  component: DashboardPage,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

function DashboardPage() {
  const { stats, categoriasChart, movimientosChart, productosBajos, topProductosChart } =
    Route.useLoaderData();
  const { setContent } = useHeader();
  const router = useRouter();

  useEffect(() => {
    setContent(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    return () => setContent(null);
  }, []);

  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-semibold tracking-tight'>Dashboard</h1>
        <p className='text-muted-foreground'>Resumen general del inventario.</p>
      </div>
      <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <CardContent className='text-3xl font-semibold'>{stats.productos}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lotes</CardTitle>
          </CardHeader>
          <CardContent className='text-3xl font-semibold'>{stats.lotes}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
          </CardHeader>
          <CardContent className='text-3xl font-semibold'>{stats.clientes}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proveedores</CardTitle>
          </CardHeader>
          <CardContent className='text-3xl font-semibold'>{stats.proveedores}</CardContent>
        </Card>
      </div>

      <div className='grid lg:grid-cols-2 gap-6'>
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
                  cursor={{ stroke: 'var(--color-border-2)' }}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-raised)',
                    borderColor: 'var(--color-border-2)',
                  }}
                />
                <Bar dataKey='cantidad' fill='#3b82f6' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
                  cursor={{ stroke: 'var(--color-border-2)' }}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-raised)',
                    borderColor: 'var(--color-border-2)',
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
      </div>

      <div className='grid lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Movimientos en los últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={movimientosChart}>
                <CartesianGrid strokeDasharray='3 3' stroke='var(--color-border-3)' />
                <XAxis dataKey='fecha_creado' />
                <YAxis />
                <Legend />
                <Tooltip
                  cursor={{ stroke: 'var(--color-border-2)' }}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-raised)',
                    borderColor: 'var(--color-border-2)',
                  }}
                />
                <Line type='monotone' dataKey='entradas' stroke='#3b82f6' strokeWidth={2} />
                <Line type='monotone' dataKey='salidas' stroke='#10b981' strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}
