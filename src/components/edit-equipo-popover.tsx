import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';

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

  useEffect(() => {
    if (open) setNombre(equipo.nombre);
  }, [open, equipo.nombre]);

  const handleSave = async () => {
    if (!nombre.trim() || nombre === equipo.nombre) return;
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

  return (
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
          disabled={loading || !nombre.trim() || nombre === equipo.nombre}
        >
          Guardar
        </Button>
      </PopoverContent>
    </Popover>
  );
}
