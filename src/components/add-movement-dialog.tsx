import { useStore } from '@tanstack/react-form';
import { useRouter } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownToDot, ArrowUpFromDot, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from './ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty';
import { Field, FieldGroup, FieldLabel, FieldSet } from './ui/field';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
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
import { cn } from '@/lib/utils';
import { userStore } from '@/stores/userStore';

const tipoOptions = [
  { value: 'entrada' as const, label: 'Entrada', Icon: ArrowDownToDot },
  { value: 'salida' as const, label: 'Salida', Icon: ArrowUpFromDot },
];

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
          <DialogDescription>Escanea productos para agregarlos al movimiento.</DialogDescription>
        </DialogHeader>

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
  const [initialProductsLoading, setInitialProductsLoading] = useState(() =>
    Boolean(initialData?.items?.length),
  );

  const [clientEquipos, setClientEquipos] = useState<UsoEquipo[]>([]);
  const [loadingClientEquipos, setLoadingClientEquipos] = useState(false);

  const { users, clientes } = useCatalogs();
  const router = useRouter();

  const scanInputRef = useRef<HTMLInputElement>(null);

  const currentUserId = userStore.state.id;

  const form = useAppForm({
    defaultValues: {
      tipo: initialData?.tipo ?? 'entrada',
      items: initialData?.items ?? [],
      detalle_entrada:
        initialData?.tipo == 'salida' ? null : { numero_factura: '', recibido_por_id: currentUserId },
      detalle_salida: initialData?.tipo == 'entrada' ? null : { cliente_id: 0, tecnico: '' },
      comentarios: '',
    } as z.input<typeof movimientoCreateSchema>,
    validators: { onSubmit: movimientoCreateSchema },
    onSubmit: async ({ value }) => {
      if (!value.detalle_entrada && !value.detalle_salida) return;

      await withAuth
        .post(ENDPOINTS.movimientos.list, value)
        .then((res) => res.data as MovimientoResponse)
        .then((mov) => {
          toast.success('¡Movimiento registrado correctamente!', {
            action: {
              label: 'Ver',
              onClick: () =>
                router.navigate({
                  to: '/movements/$id',
                  params: { id: mov.id.toString() },
                }),
            },
          });

          if (!initialData) form.reset();
          setScanCode('');
          router.invalidate();
          onSuccess();
        })
        .catch((error) => toast.error(error.response?.data?.non_field_errors?.[0] || error.message));
    },
  });

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCode.trim()) return;
    setSearching(true);

    (tipo === 'entrada' ?
      withAuth
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
    Boolean(tipo == 'salida' && values.detalle_salida?.cliente_id),
  );
  const items = useStore(form.store, (state) => state.values.items);

  const hasClientWarnings =
    !initialProductsLoading &&
    hasSelectedCliente &&
    items.some(({ producto_id }) => {
      const producto = productosMap[producto_id];
      if (!producto) return false;

      return !clientEquipos.some(({ equipo__id }) =>
        producto.equipos.map((eq) => eq.id).includes(equipo__id),
      );
    });

  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const loadInitialProducts = async () => {
      if (!initialData?.items?.length) return;

      setInitialProductsLoading(true);
      const pendingIds = initialData.items.map((item) => item.producto_id);
      if (!pendingIds.length) {
        setInitialProductsLoading(false);
        return;
      }

      try {
        const responses = await Promise.all(
          pendingIds.map((productoId) => withAuth.get(ENDPOINTS.products.detail(productoId))),
        );
        const products = responses.map((r) => r.data as ProductoResponse);

        setProductosMap((prev) => ({ ...prev, ...Object.fromEntries(products.map((p) => [p.id, p])) }));
      } catch (err) {
        toast.error('Error al cargar la información de los productos iniciales');
      } finally {
        setInitialProductsLoading(false);
      }
    };
    loadInitialProducts();
  }, [initialData]);

  return (
    <form
      id='movement-form'
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-6'
    >
      {/* Selector de tipo de movimiento */}
      <FieldSet>
        <FieldGroup>
          <form.Field name='tipo'>
            {(field) => (
              <Field>
                <FieldLabel>Tipo de movimiento</FieldLabel>
                <div className='relative flex bg-muted rounded-lg p-1'>
                  {tipoOptions.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type='button'
                      className={cn(
                        'relative z-10 flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                        tipo === value ? 'text-primary-foreground' : (
                          'text-muted-foreground hover:text-foreground'
                        ),
                      )}
                      onClick={() => field.handleChange(value)}
                    >
                      <Icon className='size-4' />
                      {label}
                    </button>
                  ))}

                  <motion.div
                    layoutId='tipo-active'
                    className='absolute inset-y-1 z-0 rounded-md bg-primary shadow-sm'
                    style={{
                      left: tipo === 'entrada' ? '4px' : 'calc(50% + 2px)',
                      width: 'calc(50% - 6px)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                </div>
              </Field>
            )}
          </form.Field>
        </FieldGroup>
      </FieldSet>

      {/* Input para escanear SKU o lote */}
      <FieldSet>
        <FieldGroup>
          <form.Field name='tipo'>
            {(field) => (
              <Field>
                <FieldLabel htmlFor='scan-input'>
                  {field.state.value === 'entrada' ? 'SKU del producto' : 'Código de lote'}
                </FieldLabel>
                <div className='flex gap-2'>
                  <Input
                    id='scan-input'
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
                    placeholder={
                      field.state.value === 'entrada' ?
                        'Escanee o escriba el SKU...'
                      : 'Escanee o escriba el código de lote...'
                    }
                  />
                  <Button type='button' disabled={searching || !scanCode.trim()} onClick={handleScanSubmit}>
                    {searching ?
                      <motion.span
                        className='flex items-center gap-2'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        Buscando...
                      </motion.span>
                    : 'Agregar'}
                  </Button>
                </div>
              </Field>
            )}
          </form.Field>
        </FieldGroup>
      </FieldSet>

      {initialProductsLoading && (
        <div className='flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400'>
          <Loader2 className='size-4 animate-spin' />
          <span>Recuperando información de los productos iniciales...</span>
        </div>
      )}

      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader className='bg-muted sticky top-0 z-10'>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead hidden={!hasSelectedCliente}>Equipo</TableHead>
              <TableHead className='w-10' />
            </TableRow>
          </TableHeader>

          <TableBody>
            <form.Field name='items' mode='array'>
              {(field) => {
                if (field.state.value.length <= 0)
                  return (
                    <TableRow>
                      <TableCell colSpan={5} className='p-6'>
                        <Empty>
                          <EmptyHeader>
                            <EmptyTitle>No hay productos</EmptyTitle>
                            <EmptyDescription>
                              Escanea un producto para agregarlo al movimiento.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  );

                return (
                  <AnimatePresence initial={false}>
                    {field.state.value.map(({ producto_id }, index) => {
                      const producto = productosMap[producto_id];
                      const isLoading = initialProductsLoading && !producto?.codigo_interno;

                      return (
                        <motion.tr
                          key={`${producto_id}-${index}`}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12, height: 0, padding: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.03, ease: 'easeOut' }}
                          className='border-b transition-colors hover:bg-muted/50'
                        >
                          <TableCell>
                            {isLoading ?
                              <Skeleton className='h-5 w-20' />
                            : producto?.codigo_interno}
                          </TableCell>
                          <TableCell>
                            {isLoading ?
                              <Skeleton className='h-5 w-48' />
                            : producto?.descripcion}
                          </TableCell>
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
                            {loadingClientEquipos ?
                              <Skeleton className='h-5 w-24' />
                            : <form.AppField name={`items[${index}].equipo_cliente_id`}>
                                {(subfield) => (
                                  <UsoEquipoDisplay
                                    matchingEquipos={clientEquipos.filter(({ equipo__id }) =>
                                      (producto?.equipos ?? []).map((eq) => eq.id).includes(equipo__id),
                                    )}
                                    value={subfield.state.value}
                                    onChange={subfield.handleChange}
                                    NumberSelectField={subfield.NumberSelectField}
                                  />
                                )}
                              </form.AppField>
                            }
                          </TableCell>
                          <TableCell>
                            <Button variant='ghost' size='icon-sm' onClick={() => field.removeValue(index)}>
                              <X />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                );
              }}
            </form.Field>
          </TableBody>
        </Table>
      </div>

      <AnimatePresence mode='wait'>
        {tipo === 'entrada' && (
          <motion.div
            key='entrada-details'
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <FieldSet>
              <FieldGroup className='grid grid-cols-3 gap-4'>
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
              </FieldGroup>
            </FieldSet>
          </motion.div>
        )}

        {tipo === 'salida' && (
          <motion.div
            key='salida-details'
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <FieldSet>
              <FieldGroup className='grid grid-cols-2 gap-4'>
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
              </FieldGroup>
            </FieldSet>
          </motion.div>
        )}
      </AnimatePresence>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant='ghost'>Cerrar</Button>
        </DialogClose>
        <form.AppForm>
          <form.SaveButton
            label='Guardar movimiento'
            disabled={hasClientWarnings || initialProductsLoading}
          />
        </form.AppForm>
      </DialogFooter>
    </form>
  );
}
