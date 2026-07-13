import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, PackageOpen } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table';
import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';

import { ENDPOINTS } from '@/api/endpoints';
import { fetchProveedorById } from '@/api/proveedores';
import { useAppForm } from '@/hooks/use-app-form';
import { useCatalogs } from '@/hooks/use-catalogs';
import { withAuth } from '@/lib/auth';
import { plural } from '@/lib/utils';
import type { ProductoResponse, ProveedorResponse } from '@/lib/types';

type ProveedorLoaderData = Awaited<ReturnType<typeof fetchProveedorById>>;

const productosColumns: ColumnDef<ProductoResponse>[] = [
  {
    accessorKey: 'codigo_interno',
    header: 'Código',
    cell: ({ row }) => (
      <Link to='/catalogo/$id' params={{ id: String(row.original.id) }} className='font-semibold'>
        {row.original.codigo_interno}
      </Link>
    ),
  },
  { accessorKey: 'descripcion', header: 'Descripción' },
  {
    accessorKey: 'cantidad_disponible',
    header: 'Existencia',
    cell: ({ row }) => plural('unidad', row.original.cantidad_disponible),
  },
];

export const Route = createFileRoute('/_app/suppliers/$id')({
  staticData: {
    headerBreadcrumb: (match) => {
      const data = match.loaderData as ProveedorLoaderData | undefined;
      return [{ label: 'Proveedores', to: '/suppliers' }, { label: data?.proveedor?.nombre ?? '...' }];
    },
  },
  loader: ({ params }) => fetchProveedorById(params.id),
  component: ProveedorDetailPage,
  errorComponent: ErrorState,
});

function ProveedorDetailPage() {
  const { proveedor, productos } = Route.useLoaderData();
  const { reloadCatalogs } = useCatalogs();
  const router = useRouter();

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' aria-label='Volver' title='Volver' onClick={() => router.history.back()}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>{proveedor.nombre}</h1>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6'>
        <ProveedorForm
          proveedor={proveedor}
          onSuccess={() => {
            router.invalidate();
            reloadCatalogs(['proveedores']);
          }}
        />

        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>Productos suministrados</CardTitle>
            <Separator />
          </CardHeader>
          <CardContent>
            <DataTable
              data={productos}
              columns={productosColumns}
              transparent
              emptyComponent={
                <Empty className='my-0 py-0'>
                  <EmptyHeader>
                    <EmptyMedia variant='decorative'>
                      <PackageOpen />
                    </EmptyMedia>
                    <EmptyTitle>Sin productos</EmptyTitle>
                    <EmptyDescription>
                      Este proveedor no tiene productos asignados.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProveedorForm({
  proveedor,
  onSuccess,
}: {
  proveedor: ProveedorResponse;
  onSuccess: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useAppForm({
    defaultValues: proveedor,
    onSubmit: async ({ value }) =>
      toast.promise(
        withAuth.patch(ENDPOINTS.proveedores.detail(proveedor.id), value).then(() => {
          setIsEditing(false);
          onSuccess();
        }),
        { loading: 'Guardando proveedor...' }
      ),
  });

  return (
    <Card>
      <form
        id='proveedor-form'
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <CardHeader>
          <header className='flex flex-row items-center justify-between'>
            <CardTitle>Datos del proveedor</CardTitle>

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
          <form.AppField name='nombre_contacto'>
            {(Field) => <Field.InputField label='Contacto' readOnly={!isEditing} />}
          </form.AppField>
          <form.AppField name='telefono'>
            {(Field) => <Field.InputField label='Teléfono' readOnly={!isEditing} />}
          </form.AppField>
          <form.AppField name='correo'>
            {(Field) => <Field.InputField label='Correo' readOnly={!isEditing} />}
          </form.AppField>
          <form.AppField name='direccion'>
            {(Field) => <Field.InputField label='Dirección' readOnly={!isEditing} />}
          </form.AppField>
        </CardContent>
      </form>
    </Card>
  );
}
