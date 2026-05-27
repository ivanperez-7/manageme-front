import { createFileRoute, Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical, PackageOpen, Plus } from 'lucide-react';
import { useEffect } from 'react';

import { DataTable } from '@/components/data-table';
import { useHeader } from '@/components/site-header';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

import { ENDPOINTS } from '@/api/endpoints';
import { useCatalogs } from '@/hooks/use-catalogs';
import { withAuth } from '@/lib/auth';
import type { ClienteResponse } from '@/lib/types';
import { CreateClienteDialog } from '@/components/create-client-dialog';

const prettierTypes: Record<ClienteResponse['tipo'], string> = { fisica: 'Física', moral: 'Moral' };

const clientesColumns: ColumnDef<ClienteResponse>[] = [
  {
    id: 'check',
    header: () => <Checkbox />,
    cell: () => <Checkbox />,
  },
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

export const Route = createFileRoute('/_app/clients/')({
  component: ClientesPage,
});

function ClientesPage() {
  const { clientes, reloadCatalogs } = useCatalogs();
  const { setContent } = useHeader();

  useEffect(() => {
    setContent(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Clientes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    return () => setContent(null);
  }, []);

  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-semibold tracking-tight'>Clientes registrados</h1>
        <p className='text-muted-foreground'>Administra los clientes registrados en el sistema.</p>
      </div>

      <DataTable
        data={clientes}
        columns={clientesColumns}
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

      <div className='fixed bottom-4 right-3 md:bottom-8 md:right-8'>
        <CreateClienteDialog
          onSuccess={reloadCatalogs}
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

function ClientTableDropdown({ clientId }: { clientId: number }) {
  const navigate = Route.useNavigate();
  const { reloadCatalogs } = useCatalogs();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon'>
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

        <DropdownMenuItem
          variant='destructive'
          onClick={() =>
            withAuth.patch(ENDPOINTS.clientes.detail(clientId), { activo: false }).then(reloadCatalogs)
          }
        >
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
