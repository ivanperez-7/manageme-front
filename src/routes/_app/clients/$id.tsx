import { useMask } from '@react-input/mask';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowLeft, ArrowUpFromDot, CheckCircle, Gauge, Loader2, Printer, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AssignEquipoDialog } from '@/components/assign-equipo-dialog';
import { DataTable } from '@/components/data-table';
import { DateRangePicker } from '@/components/date-range-pickers';
import { useHeader } from '@/components/site-header';
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import UserTag from '@/components/user-tag';

import { fetchClientById } from '@/api/catalogo';
import { ENDPOINTS } from '@/api/endpoints';
import { fetchMovimientos } from '@/api/movimientos';
import { useAppForm } from '@/hooks/use-app-form';
import { withAuth } from '@/lib/auth';
import { type ClienteResponse, type EquipoClienteResponse, type MovimientoResponse } from '@/lib/types';
import { humanDate, humanTime } from '@/lib/utils';

const movementsColumns: ColumnDef<MovimientoResponse>[] = [
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
          <CheckCircle className='size-4 text-green-700 dark:text-green-400' />
          <span className='text-muted-foreground'>{row.original.user_aprueba?.full_name}</span>
        </div>
      ),
  },
];

type MovimientoSearch = { fechaInicio?: string; fechaFin?: string };

export const Route = createFileRoute('/_app/clients/$id')({
  validateSearch: ({ fechaInicio, fechaFin }): MovimientoSearch => ({
    fechaInicio: (fechaInicio as string) || undefined,
    fechaFin: (fechaFin as string) || undefined,
  }),
  component: ClienteDetailPage,
  loader: ({ params }) => fetchClientById(params.id),
});

function ClienteDetailPage() {
  const { cliente, equiposCliente } = Route.useLoaderData();
  const router = useRouter();

  const { setContent } = useHeader();

  useEffect(() => {
    setContent(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to='/clients'>Clientes</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{cliente.nombre}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    return () => setContent(null);
  }, []);

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => router.history.back()}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <h1 className='text-3xl font-semibold tracking-tight'>{cliente.nombre}</h1>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6'>
        <ClienteForm cliente={cliente} onSuccess={router.invalidate} />

        <Card>
          <CardHeader>
            <div className='flex justify-between items-center'>
              <CardTitle>Equipos asignados</CardTitle>
              <AssignEquipoDialog clienteId={cliente.id} onSuccess={router.invalidate} />
            </div>
            <Separator />
          </CardHeader>

          <CardContent>
            {equiposCliente.length === 0 ? (
              <Empty className='my-0 py-0'>
                <EmptyHeader>
                  <EmptyMedia variant='icon'>
                    <Printer />
                  </EmptyMedia>
                  <EmptyTitle>No se ha asignado ningún equipo</EmptyTitle>
                  <EmptyDescription>Comienza registrando un equipo de este cliente</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'>
                {equiposCliente.map((eq) => (
                  <EquipoCard key={eq.id} equipo={eq} onDelete={router.invalidate} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ClientMovementsCard />
    </div>
  );
}

const ClientMovementsCard = () => {
  const { cliente, equiposCliente } = Route.useLoaderData();
  const { fechaInicio, fechaFin } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [movimientos, setMovimientos] = useState<MovimientoResponse[]>([]);
  const [oldestDate, setOldestDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    fetchMovimientos({
      clienteId: cliente.id,
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
  }, [fechaInicio, fechaFin, cliente.id, equiposCliente]);

  return (
    <Card className='mb-6'>
      <CardHeader className='grid items-center md:flex md:justify-between'>
        <CardTitle>Movimientos de salida</CardTitle>
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
            data={movimientos}
            columns={movementsColumns}
            transparent
            emptyComponent={
              <Empty className='my-0 py-0'>
                <EmptyHeader>
                  <EmptyMedia variant='icon'>
                    <ArrowUpFromDot />
                  </EmptyMedia>
                  <EmptyTitle>No se ha hecho ningún movimiento</EmptyTitle>
                  <EmptyDescription>Comienza registrando una salida de este cliente</EmptyDescription>
                </EmptyHeader>
              </Empty>
            }
          />
        )}
      </CardContent>
    </Card>
  );
};

function ClienteForm({ cliente, onSuccess }: { cliente: ClienteResponse; onSuccess: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useMask({ mask: '+52 (___) ___ ____', replacement: { _: /\d/ }, showMask: true });

  const form = useAppForm({
    defaultValues: cliente,
    onSubmit: async ({ value }) =>
      toast.promise(
        withAuth.patch(ENDPOINTS.clientes.detail(cliente.id), value).then(() => {
          setIsEditing(false);
          onSuccess();
        }),
        { loading: 'Guardando cliente...' }
      ),
  });

  return (
    <Card>
      <form
        id='client-form'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <CardHeader>
          <header className='flex flex-row items-center justify-between'>
            <CardTitle>Datos del cliente</CardTitle>

            {!isEditing ? (
              <Button type='button' variant='ghost' size='sm' onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            ) : (
              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    form.reset();
                    setIsEditing(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button size='sm' type='submit'>
                  Guardar
                </Button>
              </div>
            )}
          </header>
          <Separator />
        </CardHeader>

        <CardContent className='space-y-4 mt-4'>
          <form.AppField name='nombre'>
            {(Field) => <Field.InputField label='Nombre' readOnly={!isEditing} />}
          </form.AppField>
          <form.AppField name='telefono'>
            {(Field) => <Field.InputField ref={inputRef} label='Teléfono' readOnly={!isEditing} />}
          </form.AppField>
          <form.AppField name='rfc'>
            {(Field) => <Field.InputField label='RFC' readOnly={!isEditing} />}
          </form.AppField>
          <form.AppField name='email'>
            {(Field) => <Field.InputField label='Email' readOnly={!isEditing} />}
          </form.AppField>
        </CardContent>
      </form>
    </Card>
  );
}

function EquipoCard({ equipo, onDelete }: { equipo: EquipoClienteResponse; onDelete: () => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [incremento, setIncremento] = useState(0);

  const handleUpdateContador = () =>
    toast.promise(
      withAuth
        .post(`${ENDPOINTS.clientes.detail(equipo.cliente_id)}incrementar_contador/`, {
          equipoId: equipo.equipo_id,
          cantidad: incremento,
        })
        .then(() => {
          setPopoverOpen(false);
          setIncremento(0);
          onDelete();
        }),
      { loading: 'Actualizando contador...', error: (data) => 'Error: ' + data.message }
    );

  const handleDelete = () =>
    toast.promise(
      withAuth
        .delete(ENDPOINTS.clientes.detail(equipo.cliente_id) + 'equipos/', {
          data: { equipoId: equipo.equipo_id },
        })
        .then(() => {
          setConfirmOpen(false);
          onDelete();
        }),
      { loading: 'Eliminando equipo...', error: (data) => 'Error: ' + data.message }
    );

  return (
    <div className='relative rounded-lg border bg-card p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow'>
      <div className='flex items-start justify-between gap-2'>
        <div className='flex items-center gap-2 min-w-0'>
          <div className='flex items-center justify-center size-9 rounded-lg bg-primary/10 text-primary shrink-0'>
            <Printer className='size-4' />
          </div>
          <div className='min-w-0'>
            <p className='text-sm font-medium truncate'>{equipo.alias}</p>
            <Link to='/equipos' className='text-xs text-muted-foreground truncate hover:underline'>
              {equipo.equipo_nombre}
            </Link>
          </div>
        </div>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button variant='ghost' size='icon' className='size-7 shrink-0 -mr-1 -mt-1'>
              <Trash2 className='size-3.5 text-muted-foreground hover:text-destructive transition-colors' />
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-sm'>
            <DialogHeader>
              <DialogTitle>¿Eliminar equipo asignado?</DialogTitle>
              <DialogDescription>
                Se eliminará la asignación del equipo <strong>{equipo.equipo_nombre}</strong> con alias{' '}
                <strong>{equipo.alias}</strong>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='ghost'>Cancelar</Button>
              </DialogClose>
              <Button variant='destructive' onClick={handleDelete}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div className='flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors'>
            <Gauge className='size-3.5' />
            <span>
              Contador de uso:{' '}
              <strong className='text-foreground'>{equipo.contador_uso.toLocaleString('es-MX')}</strong>
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className='w-64' side='bottom' align='start'>
          <div className='space-y-3'>
            <p className='text-sm font-medium'>Incrementar contador</p>
            <div className='space-y-1'>
              <label className='text-xs text-muted-foreground'>Cantidad a incrementar</label>
              <Input
                type='number'
                min={0}
                value={incremento}
                onChange={(e) => setIncremento(Number(e.target.value))}
              />
            </div>
            <p className='text-xs text-muted-foreground'>
              Nuevo contador:{' '}
              <strong className='text-foreground'>
                {(equipo.contador_uso + incremento).toLocaleString('es-MX')}
              </strong>
            </p>
            <Button size='sm' className='w-full' onClick={handleUpdateContador}>
              Guardar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
