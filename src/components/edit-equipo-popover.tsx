import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
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
import type { EquipoResponse } from '@/lib/types';

export function EditEquipoPopover({
  equipo,
  open,
  onOpenChange,
  onSuccess,
  children,
}: {
  equipo: EquipoResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  children: React.ReactNode;
}) {
  const [nombre, setNombre] = useState(equipo.nombre);
  const [loading, setLoading] = useState(false);
  const [checkingSimilares, setCheckingSimilares] = useState(false);
  const [similarOpen, setSimilarOpen] = useState(false);
  const [similares, setSimilares] = useState<{ id: number; nombre: string }[]>([]);

  useEffect(() => {
    if (open) setNombre(equipo.nombre);
  }, [open, equipo.nombre]);

  const doSave = async () => {
    setLoading(true);
    toast.promise(
      withAuth
        .patch(ENDPOINTS.equipos.detail(equipo.id), { nombre })
        .then(() => {
          onOpenChange(false);
          onSuccess();
        })
        .finally(() => {
          setLoading(false);
        }),
      { loading: 'Guardando cambios...' }
    );
  };

  const handleSave = async () => {
    if (!nombre.trim() || nombre === equipo.nombre) return;

    setCheckingSimilares(true);
    try {
      const { data } = await withAuth.get(ENDPOINTS.equipos.similares(), {
        params: { marca_id: equipo.marca.id, nombre: nombre.trim(), exclude_id: equipo.id },
      });
      if (data.length > 0) {
        setSimilares(data);
        setSimilarOpen(true);
      } else {
        doSave();
      }
    } catch {
      doSave();
    } finally {
      setCheckingSimilares(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverAnchor asChild>{children}</PopoverAnchor>
        <PopoverContent className='relative w-64 space-y-3' onFocusOutside={(e) => e.preventDefault()}>
          <Input
            placeholder='Nombre del equipo'
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />

          <Button
            size='sm'
            className='w-full'
            onClick={handleSave}
            disabled={loading || checkingSimilares || !nombre.trim() || nombre === equipo.nombre}
          >
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
                  <li key={s.id} className='break-words'>{s.nombre}</li>
                ))}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No editar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSimilarOpen(false);
                doSave();
              }}
            >
              Editar de todas formas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}