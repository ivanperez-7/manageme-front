import { useStore } from '@tanstack/react-form';
import { useRouter } from '@tanstack/react-router';
import { ArrowDownToDot, ArrowUpFromDot, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type z from 'zod';

import { Button } from './ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Field, FieldGroup, FieldLabel, FieldSet } from './ui/field';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import UsoEquipoDisplay from './uso-equipo-display';

import { ENDPOINTS } from '@/api/endpoints';
import { useAppForm } from '@/hooks/use-app-form';
import { useCatalogs } from '@/hooks/use-catalogs';
import { withAuth } from '@/lib/auth';
import {
  movimientoCreateSchema,
  type LoteResponse,
  type MovimientoCreate,
  type MovimientoResponse,
  type ProductoResponse,
  type UsoEquipo,
} from '@/lib/types';
import { userStore } from '@/stores/userStore';

export function AddMovementDialog({
  trigger,
  initialData,
  useShortcut,
}: {
  trigger: React.ReactNode;
  initialData?: Partial<MovimientoCreate>;
  useShortcut?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // añade atajo de teclado ctrl + enter para abrir modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !open && useShortcut) {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent
        className='max-w-full md:max-w-4xl lg:max-w-5xl'
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
        </DialogHeader>
        <Separator />

        <MovementForm initialData={initialData} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

type ProductosMap = Record<
  number,
  Pick<ProductoResponse, 'id' | 'codigo_interno' | 'descripcion' | 'equipos'>
>;

function MovementForm({
  initialData,
  onSuccess,
}: {
  initialData?: Partial<MovimientoCreate>;
  onSuccess: () => void;
}) {
  const [scanCode, setScanCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [productosMap, setProductosMap] = useState<ProductosMap>({});

  const [clientEquipos, setClientEquipos] = useState<UsoEquipo[]>([]); // info de los equipos ligados al cliente selecc.
  const [loadingClientEquipos, setLoadingClientEquipos] = useState(false);

  const { users, clientes } = useCatalogs();
  const router = useRouter();

  const scanInputRef = useRef<HTMLInputElement>(null);

  const currentUserId = userStore.state.id;

  const form = useAppForm({
    defaultValues: {
      tipo: initialData?.tipo ?? 'entrada',
      items: initialData?.items ?? [],
      detalle_entrada: {
        numero_factura: '',
        recibido_por_id: currentUserId,
      },
      comentarios: '',
    } as z.input<typeof movimientoCreateSchema>,
    validators: { onSubmit: movimientoCreateSchema },
    onSubmit: async ({ value }) => {
      if (!value.detalle_entrada && !value.detalle_salida) return;

      await withAuth
        .post(ENDPOINTS.movimientos.list, value)
        .then((res) => {
          toast.success(`¡Movimiento ${initialData ? 'editado' : 'registrado'} correctamente!`, {
            action: {
              label: 'Ver',
              onClick: () =>
                router.navigate({
                  to: '/movements/$id',
                  params: { id: (res.data as MovimientoResponse).id.toString() },
                }),
            },
          });

          if (!initialData) form.reset();
          setScanCode('');
          router.invalidate();
          onSuccess();
        })
        .catch((error) => toast.error(error.response?.data + '' || error.message));
    },
  });

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCode.trim()) return;
    setSearching(true);

    (tipo === 'entrada'
      ? withAuth
          .get(ENDPOINTS.products.list, { params: { sku: scanCode } })
          .then((res) => res.data as ProductoResponse[])
          .then((data) => {
            if (!data.length) throw new Error('No se encontró ningún producto con este código');

            const [producto] = data;
            setProductosMap((prev) => ({ ...prev, [producto.id]: producto }));
            form.pushFieldValue('items', { producto_id: producto.id, cantidad: 1 });
          })
      : withAuth
          .get(ENDPOINTS.lotes.list, { params: { codigo_lote: scanCode } })
          .then((res) => res.data as LoteResponse[])
          .then((data) => {
            if (!data.length) throw new Error('No se encontró ningún lote con este código');

            const [lote] = data;
            if (lote.cantidad_restante <= 0)
              throw new Error('Este lote no tiene cantidad disponible para salida');

            setProductosMap((prev) => ({ ...prev, [lote.producto.id]: lote.producto }));
            form.pushFieldValue('items', {
              producto_id: lote.producto.id,
              cantidad: 1,
              lote_id: lote.id,
            });
          })
    )
      .catch((error) => toast.error(error.message))
      .finally(() => {
        setSearching(false);
        setScanCode('');
        scanInputRef.current?.focus();
      });
  };

  const checkClientEquipos = async (v: string) => {
    const selectedProductos = form.getFieldValue('items').map((item) => item.producto_id);
    if (selectedProductos.length === 0) return;
    setLoadingClientEquipos(true);

    withAuth
      .get(ENDPOINTS.clientes.detail(v) + 'equipos/', { params: { productos: selectedProductos } })
      .then((res) => setClientEquipos(res.data))
      .finally(() => setLoadingClientEquipos(false));
  };

  const tipo = useStore(form.store, ({ values }) => values.tipo);
  const hasSelectedCliente = useStore(form.store, ({ values }) =>
    Boolean(tipo == 'salida' && values.detalle_salida?.cliente_id)
  );
  const items = useStore(form.store, (state) => state.values.items);

  const hasClientWarnings =
    hasSelectedCliente &&
    items.some(({ producto_id }) => {
      const producto = productosMap[producto_id];
      if (!producto) return false;

      return !clientEquipos.some(({ equipo__id }) =>
        producto.equipos.map((eq) => eq.id).includes(equipo__id)
      );
    });

  const itemsTable = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead hidden={!hasSelectedCliente}>Equipo</TableHead>
          <TableHead className='w-10'></TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <form.Field name='items' mode='array'>
          {(field) => {
            if (field.state.value.length <= 0)
              return (
                <TableRow>
                  <TableCell colSpan={4} className='text-muted-foreground'>
                    No hay productos
                  </TableCell>
                </TableRow>
              );

            return field.state.value.map(({ producto_id }, index) => (
              <TableRow key={index}>
                <TableCell>{productosMap[producto_id].codigo_interno}</TableCell>
                <TableCell>{productosMap[producto_id].descripcion}</TableCell>
                <TableCell>
                  <form.Field name={`items[${index}].cantidad`}>
                    {(subfield) => (
                      <Input
                        className='h-8 w-20'
                        ghost
                        value={subfield.state.value}
                        onChange={(e) => subfield.handleChange(Number(e.target.value))}
                      />
                    )}
                  </form.Field>
                </TableCell>
                <TableCell hidden={!hasSelectedCliente}>
                  {loadingClientEquipos ? (
                    <span className='text-muted-foreground'>...</span>
                  ) : (
                    <form.AppField name={`items[${index}].equipo_id`}>
                      {(subfield) => (
                        <UsoEquipoDisplay
                          matchingEquipos={clientEquipos.filter(({ equipo__id }) =>
                            productosMap[producto_id].equipos.map((eq) => eq.id).includes(equipo__id)
                          )}
                          value={subfield.state.value}
                          onChange={subfield.handleChange}
                          NumberSelectField={subfield.NumberSelectField}
                        />
                      )}
                    </form.AppField>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant='ghost' size='icon-sm' onClick={() => field.removeValue(index)}>
                    <X />
                  </Button>
                </TableCell>
              </TableRow>
            ));
          }}
        </form.Field>
      </TableBody>
    </Table>
  );

  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  return (
    <form
      id='movement-form'
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-6'
    >
      <FieldSet>
        <FieldGroup className='grid grid-cols-2 gap-4'>
          <form.Field name='tipo'>
            {(field) => (
              <Field>
                <FieldLabel>Tipo</FieldLabel>
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant={field.state.value === 'entrada' ? 'default' : 'outline'}
                    onClick={() => {
                      field.handleChange('entrada');
                      form.setFieldValue('detalle_salida', undefined);
                      form.setFieldValue('detalle_entrada.recibido_por_id', currentUserId);
                    }}
                  >
                    <ArrowDownToDot /> Entrada
                  </Button>
                  <Button
                    type='button'
                    variant={field.state.value === 'salida' ? 'default' : 'outline'}
                    onClick={() => {
                      field.handleChange('salida');
                      form.setFieldValue('detalle_entrada', undefined);
                    }}
                  >
                    <ArrowUpFromDot /> Salida
                  </Button>
                </div>
              </Field>
            )}
          </form.Field>

          <div className='space-y-4'>
            <Field>
              <FieldLabel htmlFor='sku'>{tipo == 'entrada' ? 'SKU' : 'Código de lote'}</FieldLabel>
              <Input
                id='sku'
                ref={scanInputRef}
                value={scanCode}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleScanSubmit(e);
                  }
                }}
                onChange={(e) => setScanCode(e.target.value)}
                placeholder='Escanee el código...'
              />
            </Field>
            <Button
              type='button'
              variant='secondary'
              className='w-full'
              disabled={searching}
              onClick={handleScanSubmit}
            >
              Agregar
            </Button>
          </div>
        </FieldGroup>
      </FieldSet>

      {itemsTable}

      {tipo === 'entrada' && (
        <div className='grid grid-cols-3 gap-4 mt-4'>
          <form.AppField name='detalle_entrada.numero_factura'>
            {(field) => <field.InputField label='ID de prefactura' placeholder='XXX-00110011-RKO' />}
          </form.AppField>
          <form.AppField name='detalle_entrada.numero_factura'>
            {(field) => <field.InputField label='Número de factura' placeholder='XXX-00110011-RKO' />}
          </form.AppField>
          <form.AppField name='detalle_entrada.recibido_por_id'>
            {(field) => (
              <field.NumberSelectField
                label='Recibido por'
                placeholder='Seleccione un usuario'
                options={users.map((user) => ({
                  key: user.id,
                  value: user.id,
                  label: user.full_name,
                }))}
                disabled
              />
            )}
          </form.AppField>
        </div>
      )}

      {tipo === 'salida' && (
        <div className='grid grid-cols-2 gap-4 mt-4'>
          <form.AppField name='detalle_salida.cliente_id'>
            {(field) => (
              <field.NumberSelectField
                label='Cliente'
                placeholder='Seleccione un cliente'
                options={clientes.map((cli) => ({
                  key: cli.id,
                  value: cli.id,
                  label: cli.nombre,
                }))}
                onValueChange={checkClientEquipos}
              />
            )}
          </form.AppField>

          <form.AppField name='detalle_salida.tecnico'>
            {(field) => <field.InputField label='Técnico' placeholder='Nombre del técnico' />}
          </form.AppField>
        </div>
      )}

      <DialogFooter>
        <DialogClose asChild>
          <Button variant='ghost'>Cerrar</Button>
        </DialogClose>
        <form.AppForm>
          <form.SaveButton label='Guardar movimiento' disabled={hasClientWarnings} />
        </form.AppForm>
      </DialogFooter>
    </form>
  );
}

/*
- id de prefactura
- ligar correo ????
*/
