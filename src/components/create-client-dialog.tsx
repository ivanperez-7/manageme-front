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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { ENDPOINTS } from '@/api/endpoints';
import { useAppForm } from '@/hooks/use-app-form';
import { withAuth } from '@/lib/auth';
import { clienteCreateSchema } from '@/lib/types';

export function CreateClienteDialog({
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
      tipo: 'fisica',
      rfc: '',
      telefono: '',
      email: '',
      direccion: '',
    } as z.input<typeof clienteCreateSchema>,
    validators: { onSubmit: clienteCreateSchema },
    onSubmit: async ({ value }) => {
      await withAuth
        .post(ENDPOINTS.clientes.list, value)
        .then(() => {
          form.reset();
          setOpen(false);
          toast.success('Cliente creado correctamente');
          onSuccess();
        })
        .catch((error) => {
          toast.error(error.message || 'Error al crear cliente');
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
            <Plus /> Nuevo cliente
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
          <DialogDescription>Registra un nuevo cliente en el sistema.</DialogDescription>
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
                {(field) => <field.InputField label='Nombre' placeholder='Nombre del cliente' />}
              </form.AppField>
            </div>

            <form.Field name='tipo'>
              {(field) => (
                <Field className='space-y-1'>
                  <FieldLabel>Tipo de persona</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v as 'fisica' | 'moral')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='fisica'>Persona Física</SelectItem>
                      <SelectItem value='moral'>Persona Moral</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.AppField name='rfc'>
              {(field) => <field.InputField label='RFC' placeholder='Opcional' maxLength={13} />}
            </form.AppField>

            <form.AppField name='telefono'>
              {(field) => <field.InputField label='Teléfono' placeholder='Opcional' />}
            </form.AppField>

            <form.AppField name='email'>
              {(field) => <field.InputField label='Correo electrónico' placeholder='Opcional' />}
            </form.AppField>

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
              <form.SaveButton label='Guardar cliente' />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
