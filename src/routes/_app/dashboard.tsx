import { createFileRoute, ErrorComponent, Link, useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Download, Layers, Package2, Truck, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { DataTable } from '@/components/data-table';
import { DashboardSkeleton } from '@/components/route-skeletons';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import { getDashboardData, getRendimientoData } from '@/api/dashboard';
import { ENDPOINTS } from '@/api/endpoints';
import { downloadBlob } from '@/lib/download-blob';
import type { DashboardData, ProductoRendimiento } from '@/lib/types';

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
];

export const Route = createFileRoute('/_app/dashboard')({
  staticData: { headerBreadcrumb: [{ label: 'Dashboard' }] },
  loader: async () => {
    const [dashboard, rendimiento] = await Promise.all([getDashboardData(), getRendimientoData()]);
    return { ...dashboard, rendimiento };
  },
  component: DashboardPage,
  pendingComponent: DashboardSkeleton,
  pendingMs: 200,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

function DashboardPage() {
  const { stats, categoriasChart, movimientosChart, productosBajos, topProductosChart, rendimiento } =
    Route.useLoaderData();
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadRendimiento = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    await downloadBlob(ENDPOINTS.products.exportRendimiento, 'rendimiento.xlsx');
    setIsDownloading(false);
  };

  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>Dashboard</h1>
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
        <motion.div
          className='h-full'
          variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
        >
          <Card className='h-full flex flex-col'>
            <CardHeader>
              <CardTitle>Productos por categoría</CardTitle>
            </CardHeader>
            <CardContent className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={categoriasChart}>
                  <XAxis dataKey='nombre' />
                  <YAxis />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      fontSize: 13,
                    }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as { nombre: string; cantidad: number };
                      return (
                        <div className='rounded-lg border bg-card p-3 shadow-sm text-sm space-y-1'>
                          <p className='font-medium'>{d.nombre}</p>
                          <p>
                            Cantidad: <strong>{d.cantidad}</strong>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey='cantidad' fill='#3b82f6' />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          className='h-full'
          variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
        >
          <Card className='h-full flex flex-col'>
            <CardHeader>
              <CardTitle>Productos con más movimientos en los últimos 30 días</CardTitle>
            </CardHeader>
            <CardContent className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={topProductosChart}>
                  <XAxis dataKey='codigo_interno' />
                  <YAxis />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      fontSize: 13,
                    }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as DashboardData['topProductosChart'][0];
                      return (
                        <div className='rounded-lg border bg-card p-3 shadow-sm text-sm space-y-1'>
                          <p className='font-medium'>{d.codigo_interno}</p>
                          <p>
                            Movimientos: <strong>{d.total_movimientos}</strong>
                          </p>
                        </div>
                      );
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
        <motion.div
          className='h-full'
          variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
        >
          <Card className='h-full flex flex-col'>
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
                      fontSize: 13,
                    }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const ent = payload.find((p) => p.dataKey === 'entradas');
                      const sal = payload.find((p) => p.dataKey === 'salidas');
                      return (
                        <div className='rounded-lg border bg-card p-3 shadow-sm text-sm space-y-1'>
                          <p className='font-medium'>{label}</p>
                          <p style={{ color: '#3b82f6' }}>
                            Entradas: <strong>{ent?.value}</strong>
                          </p>
                          <p style={{ color: '#10b981' }}>
                            Salidas: <strong>{sal?.value}</strong>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Line type='monotone' dataKey='entradas' stroke='#3b82f6' strokeWidth={2} />
                  <Line type='monotone' dataKey='salidas' stroke='#10b981' strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          className='h-full'
          variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
        >
          <Card className='h-full flex flex-col'>
            <CardHeader>
              <CardTitle>Productos con bajo inventario</CardTitle>
            </CardHeader>
            <CardContent className='flex-1 min-h-0'>
              <DataTable transparent data={productosBajos} columns={lowStockColumns} pageSize={5} />
            </CardContent>
            <CardFooter>
              <p className='text-sm text-muted-foreground'>
                Haga clic en un producto para ver los detalles de este.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        className='grid lg:grid-cols-2 gap-6'
        initial='hidden'
        animate='visible'
        variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.7 } } }}
      >
        <motion.div
          className='lg:col-span-2'
          variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
        >
          <Card>
            <CardHeader className='grid items-center md:flex md:justify-between'>
              <CardTitle>Rendimiento de productos</CardTitle>
              <Button
                variant='outline'
                size='sm'
                className='shrink-0 self-start sm:self-auto'
                onClick={downloadRendimiento}
                disabled={isDownloading}
              >
                {isDownloading ? <Spinner /> : <Download className='h-4 w-4' />}
                Exportar rendimiento
              </Button>
            </CardHeader>
            <CardContent className='h-[350px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={rendimiento} margin={{ bottom: 60, left: 0, right: 0 }}>
                  <XAxis
                    dataKey='codigo_interno'
                    angle={-30}
                    textAnchor='end'
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 'auto']}
                    tick={{ fontSize: 12 }}
                    label={{
                      value: 'Ratio',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12 },
                    }}
                  />
                  <ReferenceLine
                    y={1}
                    stroke='#ef4444'
                    strokeDasharray='4 4'
                    label={{ value: 'Esperado (1.0)', position: 'right', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      fontSize: 13,
                    }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as ProductoRendimiento;
                      return (
                        <div className='rounded-lg border bg-card p-3 shadow-sm text-sm space-y-1'>
                          <p className='font-medium'>
                            {d.codigo_interno} — {d.descripcion}
                          </p>
                          {d.ratio != null && (
                            <>
                              <p>
                                Vida útil: <strong>{d.vida_util_unidades} unid.</strong>
                              </p>
                              <p>
                                Uso promedio: <strong>{d.uso_promedio}</strong> ({d.ciclos} ciclos)
                              </p>
                              <p>
                                Ratio unidades: <strong>{d.ratio.toFixed(2)}</strong>
                              </p>
                            </>
                          )}
                          {d.ratio_dias != null && (
                            <>
                              <p>
                                Vida útil: <strong>{d.vida_util_dias} días</strong>
                              </p>
                              <p>
                                Días promedio: <strong>{d.dias_promedio}</strong> ({d.ciclos_dias}{' '}
                                ciclos)
                              </p>
                              <p>
                                Ratio días: <strong>{d.ratio_dias.toFixed(2)}</strong>
                              </p>
                            </>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey='ratio' name='Ratio unidades' fill='#10b981' radius={[4, 4, 0, 0]}>
                    {rendimiento.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.ratio == null ? 'transparent' : entry.ratio < 1 ? '#ef4444' : '#10b981'}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey='ratio_dias' name='Ratio días' fill='#3b82f6' radius={[4, 4, 0, 0]}>
                    {rendimiento.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={
                          entry.ratio_dias == null ? 'transparent' : entry.ratio_dias < 1 ? '#ef4444' : '#3b82f6'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
            <CardFooter className='flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <p className='text-sm text-muted-foreground leading-relaxed'>
                Para cada producto se mide entre entregas consecutivas el uso consumido (unidades) y
                el tiempo transcurrido (días).
                <strong> Ratio</strong> = promedio observado / vida útil esperada, por unidades
                (verde/rojo) y por días (azul/rojo). Un ratio &lt; 1 (rojo) indica que la pieza se
                agota antes de lo esperado (rinde menos); &gt; 1 indica que dura más.
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
