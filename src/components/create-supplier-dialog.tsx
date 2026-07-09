import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

import { ENDPOINTS } from '@/api/endpoints';
import { useAppForm } from '@/hooks/use-app-form';
import { withAuth } from '@/lib/auth';
import { proveedorCreateSchema } from '@/lib/types';

export function CreateProveedorDialog({
  onSuccess,
  trigger,
}: {
  onSuccess: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const form = useAppForm({
    defaultValues: {
      nombre: '',
      nombre_contacto: '',
      telefono: '',
      correo: '',
      direccion: '',
    } as z.input<typeof proveedorCreateSchema>,
    validators: { onSubmit: proveedorCreateSchema },
    onSubmit: async ({ value }) => {
      await withAuth
        .post(ENDPOINTS.proveedores.list, value)
        .then(() => {
          form.reset();
          setOpen(false);
          toast.success('Proveedor creado correctamente');
          onSuccess();
        })
        .catch((error) => {
          toast.error(error.response?.data?.detail || error.message || 'Error al crear proveedor');
        });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) form.reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus /> Nuevo proveedor
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Nuevo proveedor</DialogTitle>
          <DialogDescription>Registra un nuevo proveedor en el sistema.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className='grid grid-cols-2 gap-4'>
            <div className='col-span-2'>
              <form.AppField name='nombre'>
                {(field) => <field.InputField label='Nombre' placeholder='Nombre del proveedor' />}
              </form.AppField>
            </div>

            <form.AppField name='nombre_contacto'>
              {(field) => <field.InputField label='Contacto' placeholder='Opcional' />}
            </form.AppField>

            <form.AppField name='telefono'>
              {(field) => <field.InputField label='Teléfono' placeholder='Opcional' />}
            </form.AppField>

            <div className='col-span-2'>
              <form.AppField name='correo'>
                {(field) => <field.InputField label='Correo electrónico' placeholder='Opcional' />}
              </form.AppField>
            </div>

            <div className='col-span-2'>
              <form.Field name='direccion'>
                {(field) => (
                  <Field className='space-y-1'>
                    <FieldLabel>Dirección</FieldLabel>
                    <Textarea
                      id={field.name}
                      value={field.state.value ?? ''}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder='Opcional'
                      rows={3}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            </div>
          </div>

          <DialogFooter className='mt-6'>
            <DialogClose asChild>
              <Button variant='ghost'>Cancelar</Button>
            </DialogClose>
            <form.AppForm>
              <form.SaveButton label='Guardar proveedor' />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
