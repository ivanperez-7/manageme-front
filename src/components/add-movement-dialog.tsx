import { useStore } from '@tanstack/react-form';
import { useRouter } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownToDot, ArrowUpFromDot, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { MovementScanInput } from './movement/movement-scan-input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
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
import { useClientEquipos } from '@/hooks/use-client-equipos';
import { useItemLookup } from '@/hooks/use-item-lookup';
import { useMovementScan } from '@/hooks/use-movement-scan';
import { withAuth } from '@/lib/auth';
import { movimientoCreateSchema, type MovimientoCreate, type MovimientoResponse } from '@/lib/types';
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
  const [alertOpen, setAlertOpen] = useState(false);
  const formHasItemsRef = useRef(false); // para advertencia al cerrar si hay productos escaneados

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
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open && formHasItemsRef.current) setAlertOpen(true);
          else setOpen(open);
        }}
      >
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className='max-w-full md:max-w-4xl lg:max-w-5xl'>
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
            <DialogDescription>Escanea productos para agregarlos al movimiento.</DialogDescription>
          </DialogHeader>

          <MovementForm
            initialData={initialData}
            onSuccess={() => {
              formHasItemsRef.current = false;
              setOpen(false);
            }}
            onItemsChange={(hasItems) => {
              formHasItemsRef.current = hasItems;
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Los productos escaneados se perderán si cierras este formulario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                formHasItemsRef.current = false;
                setAlertOpen(false);
                setOpen(false);
              }}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MovementForm({
  initialData,
  onSuccess,
  onItemsChange,
}: {
  initialData?: Partial<MovimientoCreate>;
  onSuccess: () => void;
  onItemsChange?: (hasItems: boolean) => void;
}) {
  const scan = useMovementScan();
  const clientEquipos = useClientEquipos();
  const cache = useItemLookup(initialData);

  const { clientes } = useCatalogs();
  const router = useRouter();

  const currentUserId = userStore.state.id;

  const form = useAppForm({
    defaultValues: {
      tipo: initialData?.tipo ?? 'entrada',
      items: initialData?.items ?? [],
      detalle_entrada:
        (initialData?.tipo ?? 'entrada') === 'entrada' ? { recibido_por_id: currentUserId } : null,
      comentarios: '',
    } as z.input<typeof movimientoCreateSchema>,
    validators: { onSubmit: movimientoCreateSchema },
    onSubmit: async ({ value }) =>
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
          scan.setScanCode('');
          router.invalidate();
          onSuccess();
        })
        .catch((error) => toast.error(error.response?.data?.non_field_errors?.[0] || error.message)),
  });

  const tipo = useStore(form.store, ({ values }) => values.tipo);
  const items = useStore(form.store, ({ values }) => values.items);
  const clienteId = useStore(form.store, ({ values }) =>
    tipo === 'salida' ? values.detalle_salida?.cliente_id : undefined
  );

  // Para checar que los productos escaneados tengan equipos asociados al cliente seleccionado
  useEffect(() => {
    if (!clienteId) return;
    const ids = items.map((item) => item.producto_id);
    if (ids.length > 0) clientEquipos.check(clienteId, ids);
  }, [clienteId, items.length]);

  useEffect(() => {
    onItemsChange?.(items.length > 0);
  }, [items.length, onItemsChange]);

  // Para enfocar el input de escaneo al abrir el formulario
  useEffect(() => {
    scan.scanInputRef.current?.focus();
  }, []);

  const handleScanSubmit = (e: React.FormEvent) => {
    scan.handleScanSubmit(e, tipo, {
      onProductoScanned: (producto) => {
        cache.addProducto(producto);
        form.pushFieldValue('items', { producto_id: producto.id, cantidad: 1 });
      },
      onLoteScanned: (lote) => {
        cache.addLote(lote);
        form.pushFieldValue('items', { producto_id: lote.producto.id, cantidad: 1, lote_id: lote.id });
      },
    });
  };

  const handleTipoChange = (value: 'entrada' | 'salida') => {
    if (value === 'entrada') {
      form.setFieldValue('detalle_salida', null);
      form.setFieldValue('detalle_entrada', {
        numero_factura: '',
        recibido_por_id: currentUserId,
      });
    } else {
      form.setFieldValue('detalle_entrada', null);
      form.setFieldValue('detalle_salida', {
        cliente_id: 0,
        tecnico: '',
      });
    }
    form.setFieldValue('items', []);
    cache.clearLotes();
    if (items.length > 0) toast.info('Productos eliminados al cambiar el tipo de movimiento');
  };

  const getMatchingEquipos = (productoId: number) =>
    clientEquipos.clientEquipos.filter(({ equipo_id }) =>
      (cache.productosMap[productoId]?.equipos ?? []).some((eq) => eq.id === equipo_id)
    );

  const hasClientWarnings =
    !!clienteId && items.some(({ producto_id }) => getMatchingEquipos(producto_id).length === 0);

  const renderTipoSelector = () => (
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
                      tipo === value
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => {
                      field.handleChange(value);
                      handleTipoChange(value);
                    }}
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
  );

  const renderProductItemsTable = () => (
    <Table>
      <TableHeader className='bg-muted sticky top-0 z-10'>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead hidden={tipo !== 'salida'}>Lote</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead hidden={!clienteId}>Equipo</TableHead>
          <TableHead className='w-10' />
        </TableRow>
      </TableHeader>

      <TableBody>
        <form.Field name='items' mode='array'>
          {(field) => {
            if (field.state.value.length <= 0)
              return (
                <TableRow>
                  <TableCell
                    colSpan={4 + (tipo === 'salida' ? 1 : 0) + (clienteId ? 1 : 0)}
                    className='p-6'
                  >
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
                {field.state.value.map(({ producto_id, lote_id }, index) => {
                  const producto = cache.productosMap[producto_id];
                  const lote = lote_id ? cache.lotesMap[lote_id] : undefined;

                  const isLoading = cache.initialProductsLoading;
                  const noMatching = !!clienteId && getMatchingEquipos(producto_id).length === 0;

                  return (
                    <motion.tr
                      key={`${producto_id}-${index}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12, height: 0, padding: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03, ease: 'easeOut' }}
                      className={cn(
                        'border-b transition-colors hover:bg-muted/50',
                        noMatching && 'bg-destructive/10 hover:bg-destructive/15'
                      )}
                    >
                      <TableCell>
                        {isLoading ? <Skeleton className='h-5 w-20' /> : producto?.codigo_interno}
                      </TableCell>
                      <TableCell>
                        {isLoading ? <Skeleton className='h-5 w-48' /> : producto?.descripcion}
                      </TableCell>
                      <TableCell hidden={tipo !== 'salida'}>
                        {cache.initialLotesLoading ? (
                          <Skeleton className='h-5 w-28' />
                        ) : (
                          <span className='text-sm font-mono'>{lote?.codigo_lote ?? '—'}</span>
                        )}
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
                      <TableCell hidden={!clienteId}>
                        {clientEquipos.loadingClientEquipos ? (
                          <Skeleton className='h-5 w-24' />
                        ) : (
                          <form.AppField name={`items[${index}].equipo_cliente_id`}>
                            {(subfield) => (
                              <UsoEquipoDisplay
                                matchingEquipos={getMatchingEquipos(producto_id)}
                                value={subfield.state.value}
                                onChange={subfield.handleChange}
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
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            );
          }}
        </form.Field>
      </TableBody>
    </Table>
  );

  const renderEntryDetails = () => (
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
          <Field>
            <FieldLabel>Recibido por</FieldLabel>
            <span className='text-sm text-muted-foreground'>{userStore.state?.full_name || '—'}</span>
          </Field>
        </FieldGroup>
      </FieldSet>
    </motion.div>
  );

  const renderExitDetails = () => (
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
              />
            )}
          </form.AppField>

          <form.AppField name='detalle_salida.tecnico'>
            {(field) => <field.InputField label='Técnico' placeholder='Nombre del técnico' />}
          </form.AppField>
        </FieldGroup>
      </FieldSet>
    </motion.div>
  );

  return (
    <form
      id='movement-form'
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-6'
    >
      {renderTipoSelector()}

      <MovementScanInput
        tipo={tipo}
        scanCode={scan.scanCode}
        onScanCodeChange={scan.setScanCode}
        searching={scan.searching}
        onSubmit={handleScanSubmit}
        scanInputRef={scan.scanInputRef}
      />

      {cache.initialProductsLoading && (
        <div className='flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400'>
          <Loader2 className='size-4 animate-spin' />
          <span>Recuperando información de los productos iniciales...</span>
        </div>
      )}

      <div className='overflow-hidden rounded-lg border'>{renderProductItemsTable()}</div>

      <AnimatePresence mode='wait'>
        {tipo === 'entrada' && renderEntryDetails()}
        {tipo === 'salida' && renderExitDetails()}
      </AnimatePresence>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant='ghost'>Cerrar</Button>
        </DialogClose>
        <form.AppForm>
          <form.SaveButton
            label='Guardar movimiento'
            disabled={hasClientWarnings || cache.initialProductsLoading}
          />
        </form.AppForm>
      </DialogFooter>
    </form>
  );
}
