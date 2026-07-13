import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical, Plus, Truck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table';
import { ErrorState } from '@/components/error-state';
import { CreateProveedorDialog } from '@/components/create-supplier-dialog';
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
import { useCatalogs } from '@/hooks/use-catalogs';
import { withAuth } from '@/lib/auth';
import type { ProveedorResponse } from '@/lib/types';

const proveedoresColumns: ColumnDef<ProveedorResponse>[] = [
  {
    header: 'Nombre',
    accessorKey: 'nombre',
    cell: ({ row }) => (
      <Link to='/suppliers/$id' params={{ id: String(row.original.id) }} className='font-semibold'>
        {row.original.nombre}
      </Link>
    ),
  },
  { header: 'Contacto', accessorKey: 'nombre_contacto' },
  { header: 'Teléfono', accessorKey: 'telefono' },
  { header: 'Correo', accessorKey: 'correo' },
  { header: 'Dirección', accessorKey: 'direccion' },
  {
    id: 'menu',
    cell: ({ row }) => <ProveedorTableDropdown proveedorId={row.original.id} />,
  },
];

type SuppliersSearch = { page?: number };

export const Route = createFileRoute('/_app/suppliers/')({
  staticData: { headerBreadcrumb: [{ label: 'Proveedores' }] },
  validateSearch: ({ page }): SuppliersSearch => ({
    page: page != null ? Number(page) : undefined,
  }),
  component: SuppliersPage,
  staleTime: 30_000,
  errorComponent: ErrorState,
});

function SuppliersPage() {
  const { proveedores, reloadCatalogs, isLoading } = useCatalogs();
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>Proveedores</h1>
        <p className='text-muted-foreground'>Administra los proveedores registrados en el sistema.</p>
      </div>

      {isLoading('proveedores') && !proveedores.length ? (
        <div className='flex items-center justify-center gap-2 py-16 text-muted-foreground'>
          <Spinner />
          <span className='text-sm'>Cargando proveedores...</span>
        </div>
      ) : (
        <DataTable
          data={proveedores}
          columns={proveedoresColumns}
          hiddenColumnIds={['direccion']}
          initialPage={page ?? 0}
          onChangePage={(pageIndex) =>
            navigate({ search: (prev) => ({ ...prev, page: pageIndex }), replace: true, resetScroll: false })
          }
          emptyComponent={
            <Empty className='my-0 py-0'>
              <EmptyHeader>
                <EmptyMedia variant='decorative'>
                  <Truck />
                </EmptyMedia>
                <EmptyTitle>No hay proveedores registrados</EmptyTitle>
              </EmptyHeader>
            </Empty>
          }
        />
      )}

      <div className='fixed bottom-4 right-3 md:bottom-8 md:right-8'>
        <CreateProveedorDialog
          onSuccess={() => reloadCatalogs(['proveedores'])}
          trigger={
            <Button className='rounded-full' size='icon-lg' variant='default' title='Nuevo proveedor' aria-label='Nuevo proveedor'>
              <Plus />
            </Button>
          }
        />
      </div>
    </div>
  );
}

function ProveedorTableDropdown({ proveedorId }: { proveedorId: number }) {
  const navigate = Route.useNavigate();
  const { reloadCatalogs } = useCatalogs();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => withAuth.patch(ENDPOINTS.proveedores.detail(proveedorId), { activo: false }),
    onSuccess: () => {
      toast.success('El proveedor se eliminó exitosamente');
      reloadCatalogs(['proveedores']);
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
              navigate({ to: '/suppliers/$id', params: { id: String(proveedorId) } })
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
            <AlertDialogTitle>Eliminar proveedor</AlertDialogTitle>
            <AlertDialogDescription>
              Está a punto de eliminar este proveedor. Esta acción no se puede deshacer.
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
