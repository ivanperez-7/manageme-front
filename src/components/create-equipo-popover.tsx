import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { Spinner } from '@/components/ui/spinner';

import { ENDPOINTS } from '@/api/endpoints';
import { withAuth } from '@/lib/auth';

export function CreateEquipoPopover({
  marcaId,
  onSuccess,
}: {
  marcaId: number;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSimilares, setCheckingSimilares] = useState(false);
  const [similarOpen, setSimilarOpen] = useState(false);
  const [similares, setSimilares] = useState<{ id: number; nombre: string }[]>([]);

  const doCreate = async () => {
    setLoading(true);
    toast.promise(
      withAuth
        .post(ENDPOINTS.equipos.list, { nombre, marca_id: marcaId })
        .then(() => {
          setNombre('');
          setOpen(false);
          onSuccess();
        })
        .finally(() => {
          setLoading(false);
        }),
      { loading: 'Creando equipo...' },
    );
  };

  const handleSave = async () => {
    if (!nombre.trim()) return;

    setCheckingSimilares(true);
    try {
      const { data } = await withAuth.get(ENDPOINTS.equipos.similares(), {
        params: { marca_id: marcaId, nombre: nombre.trim() },
      });
      if (data.length > 0) {
        setSimilares(data);
        setSimilarOpen(true);
      } else {
        doCreate();
      }
    } catch {
      doCreate();
    } finally {
      setCheckingSimilares(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size='sm'>
            <Plus /> Agregar equipo
          </Button>
        </PopoverTrigger>

        <PopoverContent className='w-64 space-y-3'>
          <Input
            placeholder='Nombre del equipo'
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />

          <Button size='sm' className='w-full' onClick={handleSave} disabled={loading || checkingSimilares || !nombre.trim()}>
            {checkingSimilares ? <Spinner className='mr-1 h-4 w-4' /> : null}
            {checkingSimilares ? 'Verificando...' : 'Guardar'}
          </Button>
        </PopoverContent>
      </Popover>

      <AlertDialog open={similarOpen} onOpenChange={setSimilarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Equipo posiblemente duplicado</AlertDialogTitle>
            <AlertDialogDescription className='space-y-2'>
              <p><strong>{nombre.trim()}</strong> posiblemente ya existe:</p>
              <ul className='list-disc pl-5 space-y-1'>
                {similares.map((s) => (
                  <li key={s.id}>{s.nombre}</li>
                ))}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No crear</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSimilarOpen(false);
                doCreate();
              }}
            >
              Crear de todas formas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}