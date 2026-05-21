import { createFileRoute, ErrorComponent } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import { ENDPOINTS } from '@/api/endpoints';
import { fetchAllSysvars } from '@/api/system';
import { withAuth } from '@/lib/auth';
import type { VariableSistemaResponse } from '@/lib/types';

export const Route = createFileRoute('/_app/settings')({
  loader: fetchAllSysvars,
  component: SettingsPage,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

function SettingsPage() {
  const sysvars = Route.useLoaderData();

  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-semibold tracking-tight'>Configuraciones del sistema</h1>
        <p className='text-muted-foreground'>Administra las variables de configuración del sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-base font-medium'>Variables del sistema</CardTitle>
        </CardHeader>

        <CardContent className='space-y-6'>
          {sysvars.map((sys) => (
            <SysvarRow key={sys.id} sysvar={sys} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SysvarRow({ sysvar }: { sysvar: VariableSistemaResponse }) {
  const [value, setValue] = useState(sysvar.valor);
  const [saving, setSaving] = useState(false);

  const isDirty = value !== sysvar.valor;

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await withAuth.patch(ENDPOINTS.sysvars.detail(sysvar.id), { valor: value });

      if (res.status === 200) {
        toast.success(`Guardado: ${sysvar.clave}`);
      } else {
        toast.error('No se pudo guardar.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error guardando variable');
    } finally {
      setSaving(false);
    }
  };

  const renderInput = () => {
    return (
      <Input
        value={value || ''}
        onChange={(e) => setValue(e.target.value)}
        className='w-full max-w-xs'
      />
    );
  };

  return (
    <div className='space-y-2'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div className='space-y-1'>
          <Label className='font-medium'>{sysvar.clave}</Label>
          {sysvar.descripcion && <p className='text-sm text-muted-foreground'>{sysvar.descripcion}</p>}
        </div>

        <div className='flex items-center gap-4'>
          {renderInput()}

          {isDirty && (
            <Button size='sm' onClick={handleSave} disabled={saving}>
              Guardar
            </Button>
          )}
        </div>
      </div>

      <Separator />
    </div>
  );
}
