import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical, PackageOpen, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';

import { ENDPOINTS } from '@/api/endpoints';
import { ErrorState } from '@/components/error-state';
import { useCatalogs } from '@/hooks/use-catalogs';
import { withAuth } from '@/lib/auth';
import type { ClienteResponse } from '@/lib/types';
import { CreateClienteDialog } from '@/components/create-client-dialog';

const prettierTypes: Record<ClienteResponse['tipo'], string> = { fisica: 'Física', moral: 'Moral' };

const clientesColumns: ColumnDef<ClienteResponse>[] = [
  {
    header: 'Nombre',
    accessorKey: 'nombre',
    cell: ({ row }) => (
      <Link to='/clients/$id' params={{ id: String(row.original.id) }} className='font-semibold'>
        {row.original.nombre}
      </Link>
    ),
  },
  {
    header: 'Tipo',
    accessorKey: 'tipo',
    cell: ({ row }) => <span>{prettierTypes[row.original.tipo]}</span>,
  },
  { header: 'Teléfono', accessorKey: 'telefono' },
  { header: 'Correo', accessorKey: 'email' },
  { header: 'Dirección', accessorKey: 'direccion' },
  {
    id: 'menu',
    cell: ({ row }) => <ClientTableDropdown clientId={row.original.id} />, // en otro componente para usar hooks
  },
];

type ClientsSearch = { page?: number };

export const Route = createFileRoute('/_app/clients/')({
  staticData: { headerBreadcrumb: [{ label: 'Clientes' }] },
  validateSearch: ({ page }): ClientsSearch => ({
    page: page != null ? Number(page) : undefined,
  }),
  component: ClientesPage,
  staleTime: 30_000,
  errorComponent: ErrorState,
});

function ClientesPage() {
  const { clientes, reloadCatalogs, isLoading } = useCatalogs();
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>Clientes registrados</h1>
        <p className='text-muted-foreground'>Administra los clientes registrados en el sistema.</p>
      </div>

      {isLoading('clientes') && !clientes.length ? (
        <div className='flex items-center justify-center gap-2 py-16 text-muted-foreground'>
          <Spinner />
          <span className='text-sm'>Cargando clientes...</span>
        </div>
      ) : (
        <DataTable
          data={clientes}
          columns={clientesColumns}
          hiddenColumnIds={['direccion']}
          initialPage={page ?? 0}
          onChangePage={(pageIndex) =>
            navigate({ search: (prev) => ({ ...prev, page: pageIndex }), replace: true, resetScroll: false })
          }
          emptyComponent={
            <Empty className='my-0 py-0'>
              <EmptyHeader>
                <EmptyMedia variant='decorative'>
                  <PackageOpen />
                </EmptyMedia>
                <EmptyTitle>No hay clientes registrados</EmptyTitle>
              </EmptyHeader>
            </Empty>
          }
        />
      )}

      <div className='fixed bottom-4 right-3 md:bottom-8 md:right-8'>
        <CreateClienteDialog
          onSuccess={() => reloadCatalogs(['clientes'])}
          trigger={
            <Button className='rounded-full' size='icon-lg' variant='default' title='Nuevo cliente' aria-label='Nuevo cliente'>
              <Plus />
            </Button>
          }
        />
      </div>
    </div>
  );
}

function ClientTableDropdown({ clientId }: { clientId: number }) {
  const navigate = Route.useNavigate();
  const { reloadCatalogs } = useCatalogs();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => withAuth.patch(ENDPOINTS.clientes.detail(clientId), { activo: false }),
    onSuccess: () => {
      toast.success('El cliente se eliminó exitosamente');
      reloadCatalogs(['clientes']);
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || error.message),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon' aria-label='Acciones' title='Acciones'>
            <EllipsisVertical className='w-5 h-5' />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            onClick={() =>
              navigate({
                to: '/clients/$id',
                params: { id: String(clientId) },
              })
            }
          >
            Ver / Editar
          </DropdownMenuItem>

          <DropdownMenuItem variant='destructive' onSelect={() => setConfirmOpen(true)}>
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Está a punto de eliminar este cliente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
