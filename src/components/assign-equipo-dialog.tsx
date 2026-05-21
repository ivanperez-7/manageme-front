import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { ENDPOINTS } from '@/api/endpoints';
import { useAppForm } from '@/hooks/use-app-form';
import { useCatalogs } from '@/hooks/use-catalogs';
import { withAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

export function AssignEquipoDialog({ clienteId, onSuccess }: { clienteId: number; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { equipos, marcas } = useCatalogs();

  const [search, setSearch] = useState('');
  const [selectedMarca, setSelectedMarca] = useState<number | undefined>();
  const [selectedEquipo, setSelectedEquipo] = useState<number | undefined>();

  const equiposFiltrados = useMemo(
    () =>
      equipos.filter((eq) => {
        const coincideMarca = selectedMarca ? eq.marca.id === selectedMarca : true;
        const coincideBusqueda = eq.nombre.toLowerCase().includes(search.toLowerCase());
        return coincideMarca && coincideBusqueda;
      }),
    [equipos, selectedMarca, search]
  );

  const form = useAppForm({
    defaultValues: {
      alias: '',
      contadorUso: 0,
    },
    validators: {
      onSubmit: ({ value }) => {
        if (!selectedEquipo) return 'Seleccione un equipo';
        if (!value.alias?.trim()) return 'El alias es obligatorio';
        if (value.contadorUso <= 0) return 'Contador no válido';
      },
    },
    onSubmit: async ({ value }) =>
      toast.promise(
        withAuth
          .post(ENDPOINTS.clientes.detail(clienteId) + 'equipos/', {
            ...value,
            equipoId: selectedEquipo,
          })
          .then(() => {
            setOpen(false);
            onSuccess();
          }),
        { loading: 'Asignando equipo...', error: (data) => 'Error: ' + data.message }
      ),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSearch('');
          setSelectedMarca(undefined);
          setSelectedEquipo(undefined);
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size='sm'>
          <Plus /> Asignar equipo
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-lg'>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Asignar equipo a cliente</DialogTitle>
          </DialogHeader>

          <div className='flex flex-wrap gap-2'>
            {marcas.map((m) => (
              <Badge
                key={m.id}
                variant={selectedMarca === m.id ? 'default' : 'secondary'}
                className={cn(
                  'cursor-pointer px-3 py-1 rounded-md select-none mt-6 mb-4',
                  selectedMarca === m.id && 'ring-2 ring-primary'
                )}
                onClick={() => setSelectedMarca(selectedMarca === m.id ? undefined : m.id)}
              >
                {m.nombre}
              </Badge>
            ))}
          </div>

          <Input
            placeholder='Buscar equipo...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <ScrollArea className='h-48 rounded-md border mt-4'>
            <div className='space-y-1 p-3'>
              {equiposFiltrados.length === 0 && (
                <p className='text-sm text-muted-foreground'>No hay resultados.</p>
              )}

              {equiposFiltrados.map((eq) => (
                <div
                  key={eq.id}
                  role='button'
                  tabIndex={0}
                  onClick={() => setSelectedEquipo(eq.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedEquipo(eq.id);
                  }}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer transition-colors',
                    selectedEquipo === eq.id && 'bg-primary/10 font-medium',
                    selectedEquipo !== eq.id && 'hover:bg-muted'
                  )}
                >
                  <span>{eq.nombre}</span>
                  {!selectedMarca && (
                    <span className='text-xs text-muted-foreground'>{eq.marca.nombre}</span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator className='my-4' />

          <div className='space-y-4'>
            <form.AppField
              name='alias'
              validators={{
                onChange: ({ value }) => value.trim().length <= 0,
                onSubmit: ({ value }) => value.trim().length <= 0,
              }}
            >
              {(field) => <field.InputField label='Alias' placeholder='Alias del equipo' />}
            </form.AppField>

            <form.AppField
              name='contadorUso'
              validators={{
                onChange: ({ value }) => (value <= 0 ? 'Contador no válido' : undefined),
              }}
            >
              {(field) => <field.InputField label='Contador de uso' placeholder='1500' />}
            </form.AppField>
          </div>

          <DialogFooter className='mt-6'>
            <DialogClose asChild>
              <Button variant='ghost'>Cancelar</Button>
            </DialogClose>
            <form.AppForm>
              <form.SaveButton disabled={!selectedEquipo} />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
