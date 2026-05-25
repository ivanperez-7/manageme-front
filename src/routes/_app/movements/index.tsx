import { createFileRoute, ErrorComponent, Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { CheckCircle, EllipsisVertical, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { AddMovementDialog } from '@/components/add-movement-dialog';
import { DataTable } from '@/components/data-table';
import { DateRangePicker } from '@/components/date-range-pickers';
import { useHeader } from '@/components/site-header';
import TipoMovimientoBadge from '@/components/tipo-movimiento-badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import UserTag from '@/components/user-tag';

import { fetchMovimientos } from '@/api/movimientos';
import type { MovimientoResponse } from '@/lib/types';
import { humanDate, humanTime } from '@/lib/utils';

type MovimientoSearch = { fechaInicio?: string; fechaFin?: string; page?: number };

export const Route = createFileRoute('/_app/movements/')({
  validateSearch: ({ fechaInicio, fechaFin, page }): MovimientoSearch => ({
    fechaInicio: (fechaInicio as string) || undefined,
    fechaFin: (fechaFin as string) || undefined,
    page: page != null ? Number(page) : undefined,
  }),
  loaderDeps: ({ search }) => ({ fechaInicio: search.fechaInicio, fechaFin: search.fechaFin }),
  loader: async ({ deps }) =>
    await fetchMovimientos(
      deps.fechaInicio || format(new Date(), 'yyyy-MM-dd'),
      deps.fechaFin || format(new Date(), 'yyyy-MM-dd')
    ),
  staleTime: 30_000,
  component: MovementsListPage,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

const columns: ColumnDef<MovimientoResponse>[] = [
  {
    id: 'check',
    header: () => <Checkbox />,
    cell: () => <Checkbox />,
  },
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
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => <TipoMovimientoBadge tipo={row.original.tipo} />,
  },
  {
    accessorKey: 'creado_por.username',
    header: 'Usuario',
    cell: ({ row }) => <UserTag username={row.original.creado_por.full_name} />,
  },
  { accessorKey: 'comentarios', header: 'Comentarios' },
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
  {
    id: 'actions',
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='data-[state=open]:bg-muted text-muted-foreground size-8'
            size='icon'
          >
            <EllipsisVertical />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-32'>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>
          <DropdownMenuItem>Marcar favorito</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} variant='destructive'>
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

function MovementsListPage() {
  const { movimientos, oldestDate } = Route.useLoaderData();
  const { fechaInicio, fechaFin, page } = Route.useSearch();
  const { setContent } = useHeader();
  const navigate = Route.useNavigate();

  const [search, setSearch] = useState('');
  const [filterEntrada, setFilterEntrada] = useState(true);
  const [filterSalida, setFilterSalida] = useState(true);

  const filtered = useMemo(() => {
    return movimientos.filter((m) => {
      if (search && !String(m.id).includes(search)) return false;
      if (!filterEntrada && m.tipo === 'entrada') return false;
      if (!filterSalida && m.tipo === 'salida') return false;
      return true;
    });
  }, [movimientos, search, filterEntrada, filterSalida]);

  useEffect(() => {
    setContent(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Movimientos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    return () => setContent(null);
  }, []);

  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-semibold tracking-tight'>Movimientos del almacén</h1>
        <p className='text-muted-foreground'>Consulta entradas y salidas registradas.</p>
      </div>
      <div className='flex gap-4 items-center'>
        <div className='flex-1'>
          <InputGroup>
            <InputGroupInput
              placeholder='Buscar por folio...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className='flex items-center gap-2'>
          <Checkbox checked={filterEntrada} onClick={() => setFilterEntrada((prev) => !prev)} />
          <Label onClick={() => setFilterEntrada((prev) => !prev)}>Entradas</Label>
        </div>
        <div className='flex items-center gap-2'>
          <Checkbox checked={filterSalida} onClick={() => setFilterSalida((prev) => !prev)} />
          <Label onClick={() => setFilterSalida((prev) => !prev)}>Salidas</Label>
        </div>
      </div>

      <DateRangePicker
        minDate={oldestDate ? new Date(oldestDate) : undefined}
        defaultStartDate={fechaInicio ? new Date(fechaInicio) : undefined}
        defaultEndDate={fechaFin ? new Date(fechaFin) : undefined}
        onStartDateChange={(date) =>
          navigate({
            search: (prev) => ({ ...prev, fechaInicio: format(date, 'yyyy-MM-dd') }),
            replace: true,
          })
        }
        onEndDateChange={(date) =>
          navigate({
            search: (prev) => ({ ...prev, fechaFin: format(date, 'yyyy-MM-dd') }),
            replace: true,
          })
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        initialPage={page ?? 0}
        onChangePage={(pageIndex) =>
          navigate({ search: (prev) => ({ ...prev, page: pageIndex }), replace: true })
        }
      />

      <div className='fixed bottom-4 right-3 md:bottom-8 md:right-8'>
        <AddMovementDialog
          trigger={
            <Button className='rounded-full' size='icon-lg' variant='default'>
              <Plus />
            </Button>
          }
        />
      </div>
    </div>
  );
}
