import { useRouter } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

// COMPONENTES DEL PROYECTO
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Field, FieldError, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Spinner } from './ui/spinner';

// OTRAS UTILIDADES
import { ENDPOINTS } from '@/api/endpoints';
import { useAppForm } from '@/hooks/use-app-form';
import { useCatalogs } from '@/hooks/use-catalogs';
import { withAuth } from '@/lib/auth';
import { productoCreateSchema, type ProductoResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

export function AddProductDialog({
  trigger,
  producto,
}: {
  trigger: React.ReactNode;
  producto?: ProductoResponse;
}) {
  const [open, setOpen] = useState(false);
  const { categorias, proveedores, isLoading } = useCatalogs();
  const router = useRouter();

  const form = useAppForm({
    defaultValues: {
      codigo_interno: producto?.codigo_interno ?? '',
      descripcion: producto?.descripcion ?? '',
      categoria_id: producto?.categoria.id,
      equipos_id: producto?.equipos?.map((eq) => eq.id) ?? [],
      proveedor_id: producto?.proveedor?.id || null,
      sku: producto?.sku ?? '',
      min_stock: producto?.min_stock ?? 0,
      status: producto?.status ?? 'activo',
      vida_util: producto?.vida_util ?? 0,
    },
    validators: { onSubmit: productoCreateSchema },
    onSubmit: async ({ value }) => {
      try {
        const res = producto
          ? await withAuth.patch(ENDPOINTS.products.detail(producto.id), value)
          : await withAuth.post(ENDPOINTS.products.list, value);

        if (res.status === 200 || res.status === 201) {
          toast.success(`¡Producto ${producto ? 'editado' : 'registrado'} correctamente!`);
          if (!producto) form.reset();
          setOpen(false);
          await router.invalidate({ sync: true });
        }
      } catch (error: any) {
        toast.error(error.response?.data?.codigo_interno || error.message);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className='max-w-full md:max-w-xl lg:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{producto ? 'Editar este producto' : 'Agregar nuevo producto'}</DialogTitle>
        </DialogHeader>
        <Separator />

        <form
          id='product-form'
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className='space-y-6'
        >
          {/* Datos generales */}
          <div className='space-y-4'>
            <form.AppField name='codigo_interno'>
              {(field) => <field.InputField label='Código interno' placeholder='AT1809' />}
            </form.AppField>

            <form.AppField name='descripcion'>
              {(field) => <field.InputField label='Descripción' placeholder='Pieza para KMX 3070' />}
            </form.AppField>
          </div>

          {/* Marca / Categoría */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Categoría */}
            <form.AppField name='categoria_id'>
              {(field) => (
                <field.NumberSelectField
                  label='Categoría'
                  placeholder='Seleccione una categoría'
                  loading={isLoading('categorias')}
                  options={categorias.map((cat) => ({
                    key: cat.id,
                    value: cat.id,
                    label: cat.nombre,
                  }))}
                />
              )}
            </form.AppField>

            <form.Field name='vida_util'>
              {(field) => (
                <Field className='space-y-1'>
                  <FieldLabel htmlFor={field.name}>Vida útil</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(Number(e.target.value))}
                    />
                    <InputGroupAddon align='inline-end'>unidades</InputGroupAddon>
                  </InputGroup>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name='min_stock'>
              {(field) => (
                <Field className='space-y-1'>
                  <FieldLabel htmlFor={field.name}>Stock mínimo</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(Number(e.target.value))}
                    />
                    <InputGroupAddon align='inline-end'>unidades</InputGroupAddon>
                  </InputGroup>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
          </div>

          {/* Cantidad / Stock */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <form.AppField name='sku'>
              {(field) => <field.InputField label='SKU' placeholder='17850346891' />}
            </form.AppField>

            <form.Field name='proveedor_id'>
              {(field) => (
                <Field className='space-y-1'>
                  <FieldLabel htmlFor={field.name}>Proveedor</FieldLabel>
                  <Select
                    value={String(field.state.value ?? '')}
                    onValueChange={(v) => field.handleChange(Number(v) || null)}
                  >
                    <SelectTrigger id={field.name}>
                      {isLoading('proveedores') && <Spinner className='mr-1' />}
                      <SelectValue placeholder='Seleccione un proveedor' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='0'>---------</SelectItem>
                      {proveedores.map((prov) => (
                        <SelectItem key={prov.id} value={String(prov.id)}>
                          {prov.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
          </div>

          <form.Field name='equipos_id'>
            {(field) => (
              <Field className='space-y-1'>
                <FieldLabel>Equipos compatibles</FieldLabel>
                <EquipoSelector selectedEquipos={field.state.value} onEquiposChange={field.handleChange} />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <DialogFooter className='pt-2'>
            <DialogClose asChild>
              <Button variant='ghost' className='w-full md:w-auto'>
                Cancelar
              </Button>
            </DialogClose>
            <form.AppForm>
              <form.SaveButton />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EquipoSelector({
  selectedEquipos,
  onEquiposChange,
}: {
  selectedEquipos: number[];
  onEquiposChange: (nuevos: number[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedMarca, setSelectedMarca] = useState<number | undefined>();
  const { marcas, equipos, isLoading } = useCatalogs();

  const equiposFiltrados = useMemo(
    () =>
      equipos.filter((eq) => {
        const coincideMarca = selectedMarca ? eq.marca.id === selectedMarca : true;
        const coincideBusqueda = eq.nombre.toLowerCase().includes(search.toLowerCase());
        return coincideMarca && coincideBusqueda;
      }),
    [equipos, selectedMarca, search]
  );

  return (
    <div className='space-y-4'>
      {/* Selector de marcas */}
      <div className='flex flex-wrap items-center gap-2'>
        {isLoading('marcas') && !marcas.length && <Spinner className='text-muted-foreground' />}
        {marcas.map((m) => (
          <Badge
            key={m.id}
            variant={selectedMarca === m.id ? 'default' : 'secondary'}
            className={cn(
              'cursor-pointer px-3 py-1 rounded-md',
              selectedMarca === m.id && 'ring-2 ring-primary'
            )}
            onClick={() => setSelectedMarca(selectedMarca === m.id ? undefined : m.id)}
          >
            {m.nombre}
          </Badge>
        ))}
      </div>

      <Input
        placeholder='Buscar por nombre...'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Selector de equipos */}
      <ScrollArea className='h-48 rounded-md border p-3'>
        <div className='space-y-2'>
          {isLoading('equipos') && !equipos.length ? (
            <div className='flex items-center justify-center gap-2 py-12 text-muted-foreground'>
              <Spinner />
              <span className='text-sm'>Cargando equipos...</span>
            </div>
          ) : (
            equiposFiltrados.length === 0 && (
              <p className='text-sm text-muted-foreground'>No hay resultados.</p>
            )
          )}

          {equiposFiltrados.map((eq) => (
            <label key={eq.id} className='flex items-center gap-2 text-sm cursor-pointer'>
              <Checkbox
                checked={selectedEquipos.includes(eq.id)}
                onCheckedChange={(checked) => {
                  if (checked == true) onEquiposChange([...selectedEquipos, eq.id]);
                  else onEquiposChange(selectedEquipos.filter((eqId) => eqId !== eq.id));
                }}
              />
              {eq.nombre}{' '}
              {!selectedMarca && <span className='text-xs text-muted-foreground'>{eq.marca.nombre}</span>}
            </label>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
