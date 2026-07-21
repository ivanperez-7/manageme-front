import { createFileRoute, Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, EllipsisVertical, FunnelX, Package2, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

// COMPONENTES DEL PROYECTO
import { ErrorState } from '@/components/error-state';
import { AddProductDialog } from '@/components/add-product-dialog';
import { DataTable } from '@/components/data-table';
import { DeleteProductDialog } from '@/components/delete-product-dialog';
import { CatalogoSkeleton } from '@/components/route-skeletons';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// OTRAS UTILIDADES
import { fetchAllProductos } from '@/api/catalogo';
import { ENDPOINTS } from '@/api/endpoints';
import { useCatalogs } from '@/hooks/use-catalogs';
import { downloadBlob } from '@/lib/download-blob';
import type { ProductoResponse } from '@/lib/types';
import { plural, statusFromStock } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

const columns: ColumnDef<ProductoResponse>[] = [
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
    cell: ({ row }) => (
      <Link to='/catalogo/$id' params={{ id: String(row.original.id) }} className='font-semibold'>
        {row.getValue('descripcion')}
      </Link>
    ),
  },
  { accessorKey: 'codigo_interno', header: 'Código' },
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'proveedor.nombre', header: 'Proveedor' },
  {
    accessorKey: 'equipos',
    header: 'Equipos',
    enableSorting: false,
    cell: ({ row }) => {
      const equipos = row.original.equipos;
      if (!equipos.length) return <span className='text-muted-foreground text-sm'>—</span>;
      return (
        <div className='flex flex-wrap gap-1'>
          {equipos.map((eq) => (
            <Badge key={eq.id} variant='outline' className='text-xs font-normal gap-1'>
              {eq.nombre}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: 'marcas',
    header: 'Marca',
    enableSorting: false,
    cell: ({ row }) => {
      const marcas = Array.from(
        new Map(row.original.equipos.map((eq) => [eq.marca.id, eq.marca.nombre])).values()
      );
      if (!marcas.length) return <span className='text-muted-foreground text-sm'>—</span>;
      return (
        <div className='flex flex-wrap gap-1'>
          {marcas.map((nombre) => (
            <Badge key={nombre} variant='secondary' className='text-xs font-normal'>
              {nombre}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: 'cantidad_disponible',
    header: 'Existencia',
    cell: ({ row }) =>
      row.original.cantidad_disponible > 0 && (
        <span className='inline-flex items-center gap-2'>
          {plural('unidad', row.original.cantidad_disponible)}
        </span>
      ),
  },
  {
    id: 'status',
    accessorKey: 'cantidad_disponible',
    header: 'Estado',
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger>
          {statusFromStock(row.getValue('cantidad_disponible'), row.original.min_stock)}
        </TooltipTrigger>
        <TooltipContent>
          <span className='font-medium'>Min requerido</span>:{' '}
          {plural('unidad', row.original.min_stock)}
        </TooltipContent>
      </Tooltip>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='data-[state=open]:bg-muted text-muted-foreground size-8'
            size='icon'
            title='Acciones'
          >
            <EllipsisVertical />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-32'>
          <AddProductDialog
            trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>}
            producto={row.original}
          />
          <DropdownMenuSeparator />
          <DeleteProductDialog
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} variant='destructive'>
                Eliminar
              </DropdownMenuItem>
            }
            productId={row.original.id}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

type CatalogoSearch = {
  text?: string;
  categoria?: number;
  marca?: number;
  equipo?: number;
  page?: number;
};

export const Route = createFileRoute('/_app/catalogo/')({
  staticData: { headerBreadcrumb: [{ label: 'Productos' }] },
  validateSearch: (search): CatalogoSearch => ({
    text: search.text as string,
    categoria: Number(search.categoria) || undefined,
    marca: Number(search.marca) || undefined,
    equipo: Number(search.equipo) || undefined,
    page: search.page != null ? Number(search.page) : undefined,
  }),
  loader: fetchAllProductos,
  component: ProductListPage,
  pendingComponent: CatalogoSkeleton,
  pendingMs: 200,
  errorComponent: ErrorState,
  staleTime: 30_000,
});

function ProductListPage() {
  const productos = Route.useLoaderData();
  const { text, categoria, marca, equipo, page } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { categorias, marcas, equipos, isLoading } = useCatalogs();
  const [isDownloading, setIsDownloading] = useState(false);

  const [_localText, setLocalText] = useState(text);
  const [localText] = useDebounce(_localText, 800);

  const filtered = useMemo(() => {
    return productos.filter((prod) => {
      if (
        text &&
        !prod.codigo_interno.toLowerCase().includes(text.toLowerCase()) &&
        !prod.descripcion.toLowerCase().includes(text.toLowerCase()) &&
        !prod.sku.toLowerCase().includes(text.toLowerCase()) &&
        !prod.equipos.some(
          (eq) =>
            eq.nombre.toLowerCase().includes(text.toLowerCase()) ||
            eq.marca.nombre.toLowerCase().includes(text.toLowerCase())
        )
      )
        return false;
      if (categoria && prod.categoria.id !== categoria) return false;
      if (marca && !prod.equipos.map((eq) => eq.marca.id).includes(marca)) return false;
      if (equipo && !prod.equipos.map((eq) => eq.id).includes(equipo)) return false;
      return true;
    });
  }, [productos, text, categoria, marca, equipo]);

  const emptyComponent = !productos.length ? (
    <Empty className='my-0 py-0'>
      <EmptyHeader>
        <EmptyMedia variant='decorative'>
          <Package2 />
        </EmptyMedia>
        <EmptyTitle>¡El catálogo está vacío!</EmptyTitle>
        <EmptyDescription>Comienza a registrar tus productos para monitorearlos</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ) : (
    <Empty className='my-0 py-0'>
      <EmptyHeader>
        <EmptyMedia variant='decorative'>
          <Search />
        </EmptyMedia>
        <EmptyTitle>No se encontró ningún producto</EmptyTitle>
        <EmptyDescription>Pruebe a modificar los filtro de búsqueda</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );

  useEffect(() => {
    navigate({ search: (prev) => ({ ...prev, text: localText }), replace: true });
  }, [localText]);

  const downloadExistencias = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    await downloadBlob(ENDPOINTS.products.exportExistencias, 'existencias.xlsx');
    setIsDownloading(false);
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-1'>
          <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>Buscar productos</h1>
          <p className='text-muted-foreground'>Explora y administra el catálogo de productos.</p>
        </div>
        <Button
          variant='outline'
          size='sm'
          className='shrink-0'
          onClick={downloadExistencias}
          disabled={isDownloading}
        >
          {isDownloading ? <Spinner /> : <Download className='h-4 w-4' />}
          Exportar existencias
        </Button>
      </div>
      <div className='flex flex-col gap-2 items-stretch md:flex-row md:items-center'>
        <InputGroup>
          <InputGroupInput
            placeholder='Buscar por código, descripción o SKU...'
            defaultValue={text}
            onChange={(e) => setLocalText(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        <Select
          value={String(categoria ?? '')}
          onValueChange={(v) =>
            navigate({ search: (prev) => ({ ...prev, categoria: Number(v) }), replace: true })
          }
        >
          <SelectTrigger className='w-full md:w-auto'>
            {isLoading('categorias') && <Spinner className='mr-1' />}
            <SelectValue placeholder='Categoría' />
          </SelectTrigger>
          <SelectContent>
            {categorias.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(marca ?? '')}
          onValueChange={(v) =>
            navigate({ search: (prev) => ({ ...prev, marca: Number(v) }), replace: true })
          }
        >
          <SelectTrigger className='w-full md:w-auto'>
            {isLoading('marcas') && <Spinner className='mr-1' />}
            <SelectValue placeholder='Marca' />
          </SelectTrigger>
          <SelectContent>
            {marcas.map((mar) => (
              <SelectItem key={mar.id} value={String(mar.id)}>
                {mar.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(equipo ?? '')}
          onValueChange={(v) =>
            navigate({ search: (prev) => ({ ...prev, equipo: Number(v) }), replace: true })
          }
        >
          <SelectTrigger className='w-full md:w-auto'>
            {isLoading('equipos') && <Spinner className='mr-1' />}
            <SelectValue placeholder='Modelo' />
          </SelectTrigger>
          <SelectContent>
            {equipos
              .filter((eq) => (marca ? eq.marca.id === marca : true))
              .map((eq) => (
                <SelectItem key={eq.id} value={String(eq.id)}>
                  {eq.nombre}{' '}
                  {!marca && <span className='text-xs text-muted-foreground'>{eq.marca.nombre}</span>}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Button
          variant='ghost'
          size='icon-sm'
          className='-mx-1.5'
          onClick={() => navigate({ search: {}, replace: true })}
        >
          <FunnelX />
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        hiddenColumnIds={['codigo_interno', 'proveedor.nombre']}
        emptyComponent={emptyComponent}
        initialPage={page ?? 0}
        onChangePage={(pageIndex) =>
          navigate({ search: (prev) => ({ ...prev, page: pageIndex }), replace: true, resetScroll: false })
        }
      />

      <div className='fixed bottom-4 right-3 md:bottom-8 md:right-8'>
        <AddProductDialog
          trigger={
            <Button className='rounded-full' size='icon-lg' variant='default' title='Nuevo producto' aria-label='Nuevo producto'>
              <Plus />
            </Button>
          }
        />
      </div>
    </div>
  );
}
