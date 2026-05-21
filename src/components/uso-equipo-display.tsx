import React from 'react';

import { ClientWarning } from './client-warning';

import type { UsoEquipo } from '@/lib/types';

export default function UsoEquipoDisplay({
  matchingEquipos,
  value,
  onChange,
  NumberSelectField,
}: {
  matchingEquipos: UsoEquipo[];
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  NumberSelectField: React.ComponentType<any>;
}) {
  // MULTIPLE
  if (matchingEquipos.length > 1) {
    const selectedEquipo = matchingEquipos.find((eq) => eq.id === value);
    return (
      <div className='space-y-1'>
        <NumberSelectField
          placeholder='Seleccione equipo'
          options={matchingEquipos.map((eq) => ({
            key: eq.id,
            value: eq.id,
            label: eq.equipo__nombre,
          }))}
        />

        {selectedEquipo && (
          <div className='text-xs text-muted-foreground'>Contador: {selectedEquipo.contador_uso}</div>
        )}
      </div>
    );
  }

  // SINGLE
  if (matchingEquipos.length === 1) {
    const [onlyEquipo] = matchingEquipos;

    if (value !== onlyEquipo.id) onChange(onlyEquipo.id);
    return (
      <div className='space-y-1 text-sm'>
        <span>{onlyEquipo.equipo__nombre}</span>
        <div className='text-xs text-muted-foreground'>Uso: {onlyEquipo.contador_uso}</div>
      </div>
    );
  }

  // NONE
  if (value !== undefined) onChange(undefined);
  return <ClientWarning />;
}
