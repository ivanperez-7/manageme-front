import { createFileRoute, Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import Cookies from 'js-cookie';
import { EllipsisVertical, PackageOpen, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ENDPOINTS } from '@/api/endpoints';
import { useCatalogs } from '@/hooks/use-catalogs';
import { withAuth } from '@/lib/auth';
import type { ClienteResponse } from '@/lib/types';

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
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl'>Clientes registrados</h1>

        <CreateClientePopover onSuccess={reloadCatalogs} />
      </div>

      <DataTable
        data={clientes}
        columns={clientesColumns}
        emptyComponent={
          <Empty className='my-0 py-0'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <PackageOpen />
              </EmptyMedia>
              <EmptyTitle>No hay clientes registrados</EmptyTitle>
            </EmptyHeader>
          </Empty>
        }
      />
    </div>
  );
}

function CreateClientePopover({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('fisica');

  const handleSave = () => {
    if (!nombre.trim()) return;

    toast.promise(
      withAuth.post(ENDPOINTS.clientes.list, { nombre, tipo, sucursal: Cookies.get('branch') }).then(() => {
        setNombre('');
        setOpen(false);
        onSuccess();
      }),
      { loading: 'Creando cliente...' }
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button>
          <Plus /> Nuevo cliente
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-72 space-y-3'>
        <Input placeholder='Nombre' value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />

        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Tipo de cliente' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='fisica'>Persona Física</SelectItem>
            <SelectItem value='moral'>Persona Moral</SelectItem>
          </SelectContent>
        </Select>

        <Button className='w-full' onClick={handleSave}>
          Guardar
        </Button>
      </PopoverContent>
    </Popover>
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
