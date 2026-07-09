import { createFileRoute, Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { DataTable } from '@/components/data-table';
import { DateRangePicker } from '@/components/date-range-pickers';
import { ActividadesSkeleton } from '@/components/route-skeletons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

import { fetchActividades } from '@/api/actividades';
import { useCatalogs } from '@/hooks/use-catalogs';
import { authRoleGuard } from '@/lib/auth';
import { getSegmentoLink } from '@/lib/segment-route-map';
import type { ActividadResponse } from '@/lib/types';
import { humanDate, humanTime } from '@/lib/utils';

const ACCIONES = ['create', 'update', 'delete', 'approve'] as const;

const accionBadge: Record<string, string> = {
  create: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  approve: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

const accionLabel: Record<string, string> = {
  create: 'Creación',
  update: 'Actualización',
  delete: 'Eliminación',
  approve: 'Aprobación',
};

const columns: ColumnDef<ActividadResponse>[] = [
  {
    accessorKey: 'usuario_nombre',
    header: 'Usuario',
  },
  {
    accessorKey: 'accion',
    header: 'Acción',
    cell: ({ row }) => {
      const accion = row.getValue('accion') as string;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${accionBadge[accion] || ''}`}
        >
          {accionLabel[accion] || accion}
        </span>
      );
    },
  },
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
    cell: ({ row }) => {
      const { segmentos, descripcion } = row.original;
      if (!segmentos?.length) return <span>{descripcion}</span>;
      return (
        <span>
          {segmentos.map((seg, i) => {
            if ('tipo' in seg) {
              const linkProps = getSegmentoLink(seg.tipo, seg.id);
              if (linkProps)
                return (
                  <Link key={i} {...linkProps} className='font-medium underline underline-offset-2'>
                    {seg.texto}
                  </Link>
                );
            }
            return <span key={i}>{seg.texto}</span>;
          })}
        </span>
      );
    },
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
];

type ActividadSearch = {
  usuario?: number;
  accion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
};

export const Route = createFileRoute('/_app/actividades')({
  beforeLoad: () => authRoleGuard(['admin']),
  staticData: { headerBreadcrumb: [{ label: 'Actividades' }] },
  validateSearch: ({ usuario, accion, fechaInicio, fechaFin, page }): ActividadSearch => ({
    usuario: usuario != null ? Number(usuario) : undefined,
    accion: (accion as string) || undefined,
    fechaInicio: (fechaInicio as string) || undefined,
    fechaFin: (fechaFin as string) || undefined,
    page: page != null ? Number(page) : undefined,
  }),
  loaderDeps: ({ search }) => ({
    fechaInicio: search.fechaInicio,
    fechaFin: search.fechaFin,
    usuario: search.usuario,
    accion: search.accion,
  }),
  loader: async ({ deps }) =>
    await fetchActividades({
      fechaInicio: deps.fechaInicio || format(new Date(), 'yyyy-MM-dd'),
      fechaFin: deps.fechaFin || format(new Date(), 'yyyy-MM-dd'),
      usuario: deps.usuario,
      accion: deps.accion,
    }),
  staleTime: 30_000,
  component: ActividadesListPage,
  pendingComponent: ActividadesSkeleton,
  pendingMs: 200,
  errorComponent: ErrorState,
});

function ActividadesListPage() {
  const actividades = Route.useLoaderData();
  const { fechaInicio, fechaFin, usuario, accion, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { users, isLoading } = useCatalogs();

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return actividades;
    const q = search.toLowerCase();
    return actividades.filter(
      (a) =>
        a.usuario_nombre.toLowerCase().includes(q) ||
        a.descripcion.toLowerCase().includes(q) ||
        a.accion.toLowerCase().includes(q)
    );
  }, [actividades, search]);

  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>Registro de actividades</h1>
        <p className='text-muted-foreground'>Consulta el historial de acciones realizadas en el sistema.</p>
      </div>

      <div className='flex flex-col gap-2 items-stretch md:flex-row md:items-center'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
            <input
              className='flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring'
              placeholder='Buscar en resultados...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Select
          value={String(usuario ?? '')}
          onValueChange={(v) =>
            navigate({
              search: (prev) => ({ ...prev, usuario: v ? Number(v) : undefined }),
              replace: true,
              resetScroll: false,
            })
          }
        >
          <SelectTrigger className='w-full md:w-auto'>
            {isLoading('users') && <Spinner className='mr-1' />}
            <SelectValue placeholder='Usuario' />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.full_name || u.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={accion ?? ''}
          onValueChange={(v) =>
            navigate({
              search: (prev) => ({ ...prev, accion: v || undefined }),
              replace: true,
              resetScroll: false,
            })
          }
        >
          <SelectTrigger className='w-full md:w-auto'>
            <SelectValue placeholder='Acción' />
          </SelectTrigger>
          <SelectContent>
            {ACCIONES.map((a) => (
              <SelectItem key={a} value={a}>
                {accionLabel[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DateRangePicker
        defaultStartDate={fechaInicio ? new Date(fechaInicio) : new Date()}
        defaultEndDate={fechaFin ? new Date(fechaFin) : new Date()}
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
      />

      <DataTable
        columns={columns}
        data={filtered}
        hiddenColumnIds={['hora']}
        initialPage={page ?? 0}
        onChangePage={(pageIndex) =>
          navigate({
            search: (prev) => ({ ...prev, page: pageIndex }),
            replace: true,
            resetScroll: false,
          })
        }
      />
    </div>
  );
}
