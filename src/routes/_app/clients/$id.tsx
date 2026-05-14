import { useMask } from '@react-input/mask';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, ArrowUpFromDot, CheckCircle, Plus, Printer, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table';
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

import { fetchClientById } from '@/api/catalogo';
import { ENDPOINTS } from '@/api/endpoints';
import { useAppForm } from '@/hooks/use-app-form';
import { useCatalogs } from '@/hooks/use-catalogs';
import { withAuth } from '@/lib/auth';
import { type ClienteResponse, type MovimientoResponse, type UsoEquipo } from '@/lib/types';
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
    accessorKey: 'creado_por.username',
    header: 'Usuario',
    cell: ({ row }) => <span>{row.original.creado_por.full_name}</span>,
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
];

const equiposColumns: ColumnDef<UsoEquipo>[] = [
  { header: 'Alias', accessorKey: 'alias' },
  { header: 'Equipo', accessorKey: 'equipo__nombre' },
  {
    header: 'Contador',
    accessorKey: 'contador_uso',
    cell: ({ row }) => row.original.contador_uso.toLocaleString('es-MX'),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button
        variant='ghost'
        size='icon'
        onClick={() => withAuth.delete(ENDPOINTS.clientes.detail(row.original.id) + 'del_equipo/')}
      >
        <X />
      </Button>
    ),
  },
];

export const Route = createFileRoute('/_app/clients/$id')({
  component: ClienteDetailPage,
  loader: ({ params }) => fetchClientById(params.id),
});

function ClienteDetailPage() {
  const { cliente, equiposCliente, movimientos } = Route.useLoaderData();
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
        <h1 className='text-2xl'>{cliente.nombre}</h1>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6'>
        <ClienteForm cliente={cliente} onSuccess={router.invalidate} />

        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle>Equipos asignados</CardTitle>

            <AssignEquipoPopover clienteId={cliente.id} onSuccess={router.invalidate} />
          </CardHeader>

          <CardContent>
            <DataTable
              data={equiposCliente}
              columns={equiposColumns}
              transparent
              emptyComponent={
                <Empty className='my-0 py-0'>
                  <EmptyHeader>
                    <EmptyMedia variant='icon'>
                      <Printer />
                    </EmptyMedia>
                    <EmptyTitle>No se ha asignado ningún equipo</EmptyTitle>
                    <EmptyDescription>Comienza registrando un equipo de este cliente</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card className='mb-6'>
        <CardHeader className='grid items-center md:flex md:justify-between'>
          <CardTitle>Últimos movimientos de salida</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}

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

function AssignEquipoPopover({ clienteId, onSuccess }: { clienteId: number; onSuccess: () => void }) {
  const { equipos } = useCatalogs();

  const form = useAppForm({
    defaultValues: {
      alias: '',
      equipoId: 0,
      contadorUso: 0,
    },
    onSubmit: async ({ value }) =>
      toast.promise(
        withAuth.post(ENDPOINTS.clientes.detail(clienteId) + 'equipos/', value).then(onSuccess),
        { loading: 'Asignando equipo...', error: (data) => 'Error: ' + data.message }
      ),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size='sm'>
          <Plus /> Asignar equipo
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-72 space-y-3'>
        <form
          id='uso-equipo-form'
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className='space-y-6'
        >
          <form.AppField
            name='equipoId'
            validators={{
              onChange: ({ value }) => (value <= 0 ? 'Equipo no seleccionado' : undefined),
            }}
          >
            {(field) => (
              <field.NumberSelectField
                label='Equipo'
                placeholder='Seleccione un equipo'
                options={equipos.map((eq) => ({
                  key: eq.id,
                  value: eq.id,
                  label: eq.nombre,
                }))}
              />
            )}
          </form.AppField>

          <form.AppField
            name='contadorUso'
            validators={{
              onChange: ({ value }) => (value <= 0 ? 'Contador no válido' : undefined),
            }}
          >
            {(field) => <field.InputField label='Contador de uso' placeholder='1500' />}
          </form.AppField>

          <form.AppField name='alias'>
            {(field) => <field.InputField label='Alias' placeholder='Alias del equipo' />}
          </form.AppField>

          <form.AppForm>
            <form.SaveButton className='w-full' />
          </form.AppForm>
        </form>
      </PopoverContent>
    </Popover>
  );
}
