import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

import { ClientWarning } from './client-warning';

import { NumberSelectField } from '@/hooks/use-app-form';
import type { EquipoClienteResponse } from '@/lib/types';

export default function UsoEquipoDisplay({
  matchingEquipos,
  value,
  onChange,
}: {
  matchingEquipos: EquipoClienteResponse[];
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  const onlyEquipo = matchingEquipos.length === 1 ? matchingEquipos[0] : null;

  // Si hay exactamente un equipo coincidente, actualiza el valor al ID de ese equipo
  useEffect(() => {
    if (matchingEquipos.length === 1 && value !== matchingEquipos[0].id) {
      onChange(matchingEquipos[0].id);
    }
  }, [matchingEquipos.length, onlyEquipo?.id, value, onChange]);

  // Si no hay equipos coincidentes pero hay un valor seleccionado, limpia el valor
  useEffect(() => {
    if (matchingEquipos.length === 0 && value !== undefined) {
      onChange(undefined);
    }
  }, [matchingEquipos.length, value, onChange]);

  let content: React.ReactNode;

  // MULTIPLE
  if (matchingEquipos.length > 1) {
    const selectedEquipo = matchingEquipos.find((eq) => eq.id === value);

    content = (
      <motion.div
        key='multiple'
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className='space-y-1'
      >
        <NumberSelectField
          placeholder='Seleccione equipo'
          options={matchingEquipos.map((eq) => ({
            key: eq.id,
            value: eq.id,
            label: eq.equipo_nombre,
          }))}
        />

        {selectedEquipo && (
          <div className='text-xs text-muted-foreground'>Contador: {selectedEquipo.contador_uso}</div>
        )}
      </motion.div>
    );
  } else if (onlyEquipo) {
    content = (
      <motion.div
        key='single'
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className='space-y-1 text-sm'
      >
        <span>{onlyEquipo.equipo_nombre}</span>
        <div className='text-xs text-muted-foreground'>Uso: {onlyEquipo.contador_uso}</div>
      </motion.div>
    );
  } else {
    content = (
      <motion.div
        key='none'
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.15 }}
      >
        <ClientWarning />
      </motion.div>
    );
  }

  return <AnimatePresence mode='wait'>{content}</AnimatePresence>;
}
