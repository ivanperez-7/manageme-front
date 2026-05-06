import { createFileRoute, ErrorComponent, Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { DataTable } from '@/components/data-table';
import { DeficitProgress } from '@/components/deficit-progress';
import { useHeader } from '@/components/site-header';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getDashboardData } from '@/api/dashboard';
import type { DashboardData } from '@/lib/types';
import type { ColumnDef } from '@tanstack/react-table';

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
  const { stats, categoriasChart, salidasChart, productosBajos, clientesChart } = Route.useLoaderData();
  const { setContent } = useHeader();

  const colors = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#a855f7'];

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
                <Tooltip />
                <Bar dataKey='cantidad' fill='#3b82f6' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salidas en los últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={salidasChart}>
                <CartesianGrid strokeDasharray='3 3' stroke='var(--color-border-3)' />
                <XAxis dataKey='fecha_creado' />
                <YAxis />
                <Tooltip
                  cursor={{ stroke: 'var(--color-border-2)' }}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-raised)',
                    borderColor: 'var(--color-border-2)',
                  }}
                />
                <Line type='monotone' dataKey='total' stroke='#10b981' strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className='grid lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Clientes por tipo (física vs moral)</CardTitle>
          </CardHeader>
          <CardContent className='h-[300px] flex justify-center'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie data={clientesChart} dataKey='cantidad' nameKey='tipo2' outerRadius={110} label>
                  {clientesChart.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
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
        </Card>
      </div>
    </div>
  );
}
