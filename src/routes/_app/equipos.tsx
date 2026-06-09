import { createFileRoute, ErrorComponent } from '@tanstack/react-router';
import { Check, ChevronsUpDown, MoreVertical, Pencil, Printer, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CreateEquipoPopover } from '@/components/create-equipo-popover';
import { CreateMarcaPopover } from '@/components/create-marca-popover';
import { DeleteMarcaDialog } from '@/components/delete-marca-dialog';
import { EditEquipoPopover } from '@/components/edit-equipo-popover';
import { EquipoProductosDialog } from '@/components/equipo-productos-dialog';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';

import { ENDPOINTS } from '@/api/endpoints';
import { useCatalogs } from '@/hooks/use-catalogs';
import { withAuth } from '@/lib/auth';
import type { EquipoResponse, MarcaResponse } from '@/lib/types';

export const Route = createFileRoute('/_app/equipos')({
  staticData: { headerBreadcrumb: [{ label: 'Equipos' }] },
  component: EquiposPage,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

function EquiposPage() {
  const { marcas, equipos, reloadCatalogs, isLoading } = useCatalogs();

  const [selectedMarca, setSelectedMarca] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const marcasFiltradas = useMemo(() => {
    return marcas.filter((marca) => marca.nombre.toLowerCase().includes(search.toLowerCase()));
  }, [marcas, search]);

  const equiposFiltrados = useMemo(() => {
    if (!selectedMarca) return [];
    return equipos.filter((e) => e.marca.id === selectedMarca);
  }, [equipos, selectedMarca]);

  const selectedMarcaData = marcas.find((m) => m.id === selectedMarca);

  useEffect(() => {
    if (!selectedMarca && marcas.length > 0) {
      setSelectedMarca(marcas[0].id);
    }
  }, [marcas, selectedMarca]);

  return (
    <div className='flex flex-col gap-4'>
      {/* HEADER */}
      <div className='flex items-start justify-between'>
        <div className='space-y-1'>
          <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>Equipos</h1>
          <p className='text-muted-foreground'>Administra marcas y equipos registrados.</p>
        </div>

        <CreateMarcaPopover onSuccess={() => reloadCatalogs(['marcas'])} />
      </div>

      {/* CONTENT */}
      <div className='grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border bg-background md:grid-cols-[300px_1fr]'>
        {/* SIDEBAR */}
        <aside className='flex min-h-0 flex-col border-r'>
          <div className='space-y-3 p-4'>
            <Input
              placeholder='Buscar marca...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Separator />

          <ScrollArea className='flex-1'>
            <div className='space-y-1 p-2'>
              {isLoading('marcas') && !marcas.length && (
                <div className='flex items-center justify-center gap-2 py-16 text-muted-foreground'>
                  <Spinner />
                  <span className='text-sm'>Cargando marcas...</span>
                </div>
              )}

              {marcasFiltradas.map((marca) => {
                const count = equipos.filter((e) => e.marca.id === marca.id).length;

                const active = selectedMarca === marca.id;

                return (
                  <div
                    key={marca.id}
                    className={`
                      group flex items-center gap-2 rounded-xl border px-2 py-2 transition-all
                      ${active ? 'border-primary/20 bg-accent' : 'border-transparent hover:bg-accent/50'}
                    `}
                  >
                    <button
                      onClick={() => setSelectedMarca(marca.id)}
                      className='flex flex-1 items-center justify-between text-left'
                    >
                      <div className='flex min-w-0 items-center gap-2'>
                        {active && <Check className='h-4 w-4 text-primary' />}

                        {!active && (
                          <ChevronsUpDown className='h-4 w-4 text-muted-foreground opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100' />
                        )}

                        <span className='truncate font-medium'>{marca.nombre}</span>
                      </div>

                      <Badge variant='secondary'>{count}</Badge>
                    </button>

                    <DeleteMarcaDialog
                      trigger={
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100'
                        >
                          <Trash2 className='h-4 w-4 text-destructive' />
                        </Button>
                      }
                      marcaId={marca.id}
                      onSuccess={() => {
                        if (selectedMarca === marca.id) {
                          setSelectedMarca(null);
                        }

                        reloadCatalogs(['marcas', 'equipos']);
                      }}
                    />
                  </div>
                );
              })}

              {!isLoading('marcas') && marcasFiltradas.length === 0 && (
                <div className='flex flex-col items-center justify-center py-16 text-center'>
                  <Printer className='mb-4 h-10 w-10 text-muted-foreground' />
                  <h3 className='font-medium'>No hay marcas</h3>
                  <p className='text-sm text-muted-foreground'>Intenta con otra búsqueda.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* MAIN */}
        <main className='flex min-h-0 flex-col'>
          {selectedMarcaData ? (
            <>
              {/* HEADER */}
              <div className='flex items-start justify-between border-b p-6'>
                <div className='space-y-2'>
                  <EditableMarcaNombre
                    marca={selectedMarcaData}
                    onRename={() => reloadCatalogs(['marcas'])}
                  />

                  <p className='text-sm text-muted-foreground'>
                    {equiposFiltrados.length} equipos registrados
                  </p>
                </div>

                <CreateEquipoPopover
                  marcaId={selectedMarcaData.id}
                  onSuccess={() => reloadCatalogs(['equipos'])}
                />
              </div>

              {/* EQUIPOS */}
              <ScrollArea className='flex-1'>
                <div className='space-y-3 p-6'>
                  {equiposFiltrados.map((equipo) => (
                    <EquipoCard
                      key={equipo.id}
                      equipo={equipo}
                      onDeleted={() => reloadCatalogs(['equipos'])}
                    />
                  ))}

                  {equiposFiltrados.length === 0 && (
                    <Card className='border-dashed'>
                      <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
                        <Printer className='mb-4 h-10 w-10 text-muted-foreground' />

                        <h3 className='font-medium'>No hay equipos</h3>

                        <p className='text-sm text-muted-foreground'>
                          Agrega el primer equipo para esta marca.
                        </p>

                        <div className='mt-4'>
                          <CreateEquipoPopover
                            marcaId={selectedMarcaData.id}
                            onSuccess={() => reloadCatalogs(['equipos'])}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className='flex flex-1 items-center justify-center'>
              <div className='text-center'>
                <Printer className='mx-auto mb-4 h-10 w-10 text-muted-foreground' />

                <h3 className='font-medium'>Selecciona una marca</h3>

                <p className='text-sm text-muted-foreground'>Elige una marca para ver sus equipos.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function EditableMarcaNombre({ marca, onRename }: { marca: MarcaResponse; onRename: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(marca.nombre);

  useEffect(() => {
    setName(marca.nombre);
  }, [marca.nombre]);

  async function save() {
    if (name.trim() === '' || name === marca.nombre) {
      setEditing(false);
      return;
    }

    toast.promise(
      withAuth
        .patch(ENDPOINTS.marcas.detail(marca.id), {
          nombre: name,
        })
        .then(() => {
          onRename();
          setEditing(false);
        }),
      {
        loading: 'Guardando cambios...',
        success: 'Marca actualizada',
        error: 'No se pudo actualizar',
      }
    );
  }

  if (editing) {
    return (
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            save();
          }

          if (e.key === 'Escape') {
            setName(marca.nombre);
            setEditing(false);
          }
        }}
        className='h-auto border-none p-0 text-3xl font-semibold shadow-none focus-visible:ring-0'
      />
    );
  }

  return (
    <button onClick={() => setEditing(true)} className='group flex items-center gap-2'>
      <h2 className='text-2xl md:text-3xl font-semibold tracking-tight'>{marca.nombre}</h2>

      <Pencil className='h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100' />
    </button>
  );
}

function EquipoCard({ equipo, onDeleted }: { equipo: EquipoResponse; onDeleted: () => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productosOpen, setProductosOpen] = useState(false);

  const remove = async () =>
    toast.promise(
      withAuth
        .patch(ENDPOINTS.equipos.detail(equipo.id), {
          activo: false,
        })
        .then(onDeleted),
      {
        loading: 'Eliminando equipo...',
        success: 'Equipo eliminado',
        error: 'No se pudo eliminar',
      }
    );

  return (
    <Card className='transition-colors hover:bg-accent/40'>
      <CardContent className='flex items-center justify-between '>
        <button
          type='button'
          onClick={() => setProductosOpen(true)}
          className='flex flex-1 items-center gap-3 text-left'
        >
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
            <Printer className='h-5 w-5 text-primary' />
          </div>

          <div>
            <p className='font-medium'>{equipo.nombre}</p>
            <p className='text-sm text-muted-foreground'>Ver detalle del equipo</p>
          </div>
        </button>

        <DropdownMenu>
          <EditEquipoPopover
            equipo={equipo}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={onDeleted}
          >
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon'>
                <MoreVertical className='h-5 w-5' />
              </Button>
            </DropdownMenuTrigger>
          </EditEquipoPopover>

          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className='mr-2 h-4 w-4' />
              Editar
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem variant='destructive' onClick={() => setDeleteConfirmOpen(true)}>
              <Trash2 className='mr-2 h-4 w-4' />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>

      <EquipoProductosDialog equipo={equipo} open={productosOpen} onOpenChange={setProductosOpen} />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar equipo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar <strong>{equipo.nombre}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={() => {
                setDeleteConfirmOpen(false);
                remove();
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
