import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-form';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownToDot, ArrowLeft, ArrowUpFromDot, Loader2, PackageOpen, X } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { MovementScanInput } from '@/components/movement/movement-scan-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import UsoEquipoDisplay from '@/components/uso-equipo-display';

import { ENDPOINTS } from '@/api/endpoints';
import { useAppForm } from '@/hooks/use-app-form';
import { useCatalogs } from '@/hooks/use-catalogs';
import { useClientEquipos, useItemLookup, useMovementScan } from '@/hooks/use-movement-form-data';
import { withAuth } from '@/lib/auth';
import { movimientoCreateSchema, type MovimientoCreate, type MovimientoResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
import { userStore } from '@/stores/userStore';

const tipoOptions = [
  { value: 'entrada' as const, label: 'Entrada', Icon: ArrowDownToDot },
  { value: 'salida' as const, label: 'Salida', Icon: ArrowUpFromDot },
];

type MovementNewSearch = { initialData?: Partial<MovimientoCreate> };

export const Route = createFileRoute('/_app/movements/new')({
  staticData: {
    headerBreadcrumb: [{ label: 'Movimientos', to: '/movements' }, { label: 'Registrar' }],
  },
  validateSearch: (search): MovementNewSearch => ({
    initialData: (search.initialData as Partial<MovimientoCreate>) || undefined,
  }),
  component: AddMovementPage,
});

function AddMovementPage() {
  const { initialData } = Route.useSearch();

  const scan = useMovementScan();
  const clientEquipos = useClientEquipos();
  const cache = useItemLookup(initialData, true);
  const { clientes } = useCatalogs();
  const router = useRouter();

  const currentUserId = userStore.state.id;
  const initialTipo = initialData?.tipo ?? 'entrada';

  const form = useAppForm({
    defaultValues: {
      tipo: initialTipo,
      items: initialData?.items ?? [],
      detalle_entrada:
        initialTipo === 'entrada' ? { recibido_por_id: currentUserId, numero_factura: '' } : null,
      detalle_salida: initialTipo === 'salida' ? initialData?.detalle_salida : null,
      comentarios: '',
    } as z.input<typeof movimientoCreateSchema>,
    validators: { onSubmit: movimientoCreateSchema },
    onSubmit: async ({ value }) =>
      await withAuth
        .post(ENDPOINTS.movimientos.list, value)
        .then((res) => res.data as MovimientoResponse)
        .then((mov) => {
          toast.success('¡Movimiento registrado correctamente!');

          scan.setScanCode('');
          router.invalidate();
          router.navigate({ to: '/movements/$id', params: { id: mov.id.toString() } });
        })
        .catch((error) => toast.error(error.response?.data?.non_field_errors?.[0] || error.message)),
  });

  const tipo = useStore(form.store, ({ values }) => values.tipo);
  const items = useStore(form.store, ({ values }) => values.items);
  const clienteId = useStore(form.store, ({ values }) =>
    tipo === 'salida' ? values.detalle_salida?.cliente_id : undefined
  );

  useEffect(() => {
    if (!clienteId) return;
    const ids = items.map((item) => item.producto_id);
    if (ids.length > 0) clientEquipos.check(clienteId, ids);
  }, [clienteId, items.length]);

  useEffect(() => {
    scan.scanInputRef.current?.focus();
  }, []);

  const handleScanSubmit = (e: React.FormEvent) => {
    scan.handleScanSubmit(e, tipo, {
      onProductoScanned: (producto) => {
        cache.addProducto(producto);
        form.pushFieldValue('items', {
          producto_id: producto.id,
          cantidad: 1,
          cambio_anticipado: false,
          motivo_cambio: null,
        });
      },
      onLoteScanned: (lote) => {
        cache.addLote(lote);
        form.pushFieldValue('items', {
          producto_id: lote.producto.id,
          cantidad: 1,
          lote_id: lote.id,
          cambio_anticipado: false,
          motivo_cambio: null,
        });
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

  const getMatchingEquipos = useCallback(
    (productoId: number) =>
      clientEquipos.clientEquipos.filter(({ equipo_id }) =>
        (cache.productosMap[productoId]?.equipos ?? []).some((eq) => eq.id === equipo_id)
      ),
    [clientEquipos.clientEquipos, cache.productosMap]
  );

  const hasClientWarnings = useMemo(
    () => !!clienteId && items.some(({ producto_id }) => getMatchingEquipos(producto_id).length === 0),
    [clienteId, items, getMatchingEquipos]
  );

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
          <TableHead className='w-56' hidden={!clienteId}>
            Equipo
          </TableHead>
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
                    className='p-10'
                  >
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant='icon'>
                          <PackageOpen />
                        </EmptyMedia>
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
                {field.state.value.map(({ producto_id, lote_id, cambio_anticipado }, index) => {
                  const producto = cache.productosMap[producto_id];
                  const lote = lote_id ? cache.lotesMap[lote_id] : undefined;

                  const isLoading = cache.initialLoading;
                  const noMatching =
                    !!clienteId &&
                    !clientEquipos.loadingClientEquipos &&
                    getMatchingEquipos(producto_id).length === 0;

                  return (
                    <>
                      <motion.tr
                        key={`${producto_id}-${index}`}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12, height: 0, padding: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: Math.min(index * 0.03, 0.3),
                          ease: 'easeOut',
                        }}
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
                          {cache.initialLoading ? (
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
                        <TableCell
                          className='w-56 max-w-56 [&_button]:w-full [&_button]:min-w-0'
                          hidden={!clienteId}
                        >
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
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            onClick={() => field.removeValue(index)}
                          >
                            <X />
                          </Button>
                        </TableCell>
                      </motion.tr>
                      {tipo === 'salida' && (
                        <motion.tr
                          key={`${producto_id}-${index}-ant`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className='border-b bg-muted/20'
                        >
                          <TableCell
                            colSpan={4 + (tipo === 'salida' ? 1 : 0) + (clienteId ? 1 : 0)}
                            className='py-2'
                          >
                            <div className='flex items-center gap-4 pl-4'>
                              <form.Field name={`items[${index}].cambio_anticipado`}>
                                {(subfield) => (
                                  <label className='flex items-center gap-2 text-sm cursor-pointer select-none'>
                                    <input
                                      type='checkbox'
                                      checked={subfield.state.value}
                                      onChange={(e) => subfield.handleChange(e.target.checked)}
                                      className='size-4 accent-primary'
                                    />
                                    Cambio anticipado
                                  </label>
                                )}
                              </form.Field>
                              <form.Field name={`items[${index}].motivo_cambio`}>
                                {(subfield) => (
                                  <Input
                                    className={cn('h-8 w-64', !cambio_anticipado && 'hidden')}
                                    ghost
                                    value={subfield.state.value ?? ''}
                                    onChange={(e) => subfield.handleChange(e.target.value || null)}
                                    placeholder='Motivo del cambio anticipado...'
                                  />
                                )}
                              </form.Field>
                            </div>
                          </TableCell>
                        </motion.tr>
                      )}
                    </>
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
        <FieldGroup className='grid grid-cols-1 gap-4'>
          <form.AppField name='detalle_entrada.numero_factura'>
            {(field) => <field.InputField label='Número de factura' placeholder='9284' numeric />}
          </form.AppField>
          <Field>
            <FieldLabel>Recibido por</FieldLabel>
            <Input value={userStore.state?.full_name || '—'} readOnly />
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
        <FieldGroup className='grid grid-cols-1 gap-4'>
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
      className='flex min-h-0 flex-1 flex-col'
    >
      {/* HEADER */}
      <header className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <Button type='button' variant='ghost' size='icon' onClick={() => router.history.back()}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>Registrar movimiento</h1>
            <p className='text-sm text-muted-foreground'>
              Escanea productos para agregarlos al movimiento.
            </p>
          </div>
        </div>

        <div className='hidden md:flex items-center gap-2'>
          <Button type='button' variant='ghost' onClick={() => router.history.back()}>
            Cancelar
          </Button>
          <form.AppForm>
            <form.SaveButton
              label='Guardar movimiento'
              disabled={hasClientWarnings || cache.initialLoading}
            />
          </form.AppForm>
        </div>
      </header>

      {/* TWO-COLUMN WORKSPACE */}
      <div className='mt-6 grid flex-1 min-h-0 gap-6 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr]'>
        {/* LEFT: configuration */}
        <div className='flex flex-col gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Configuración</CardTitle>
              <Separator />
            </CardHeader>
            <CardContent className='space-y-6'>
              {renderTipoSelector()}

              <AnimatePresence mode='wait'>
                {tipo === 'entrada' && renderEntryDetails()}
                {tipo === 'salida' && renderExitDetails()}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Escaneo</CardTitle>
              <Separator />
            </CardHeader>
            <CardContent>
              <MovementScanInput
                tipo={tipo}
                scanCode={scan.scanCode}
                onScanCodeChange={scan.setScanCode}
                searching={scan.searching}
                onSubmit={handleScanSubmit}
                scanInputRef={scan.scanInputRef}
              />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: live product table */}
        <div className='flex min-h-0 min-w-0 flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold'>Productos</h2>
            <span className='text-sm text-muted-foreground'>
              {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          {cache.initialLoading && (
            <div className='flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400'>
              <Loader2 className='size-4 animate-spin' />
              <span>Recuperando información de los productos iniciales...</span>
            </div>
          )}

          <div className='min-h-0 flex-1 overflow-auto rounded-lg border'>
            {renderProductItemsTable()}
          </div>
        </div>
      </div>

      {/* MOBILE ACTION BAR */}
      <div className='mt-6 flex items-center justify-end gap-2 md:hidden'>
        <Button type='button' variant='ghost' onClick={() => router.history.back()}>
          Cancelar
        </Button>
        <form.AppForm>
          <form.SaveButton
            label='Guardar movimiento'
            disabled={hasClientWarnings || cache.initialLoading}
          />
        </form.AppForm>
      </div>
    </form>
  );
}
