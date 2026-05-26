import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

import { ClientWarning } from './client-warning';

import { NumberSelectField } from '@/hooks/use-app-form';
import type { UsoEquipo } from '@/lib/types';

export default function UsoEquipoDisplay({
  matchingEquipos,
  value,
  onChange,
}: {
  matchingEquipos: UsoEquipo[];
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
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
            label: eq.equipo__nombre,
          }))}
        />

        {selectedEquipo && (
          <div className='text-xs text-muted-foreground'>Contador: {selectedEquipo.contador_uso}</div>
        )}
      </motion.div>
    );
  } else if (matchingEquipos.length === 1) {
    const [onlyEquipo] = matchingEquipos;

    if (value !== onlyEquipo.id) onChange(onlyEquipo.id);
    content = (
      <motion.div
        key='single'
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className='space-y-1 text-sm'
      >
        <span>{onlyEquipo.equipo__nombre}</span>
        <div className='text-xs text-muted-foreground'>Uso: {onlyEquipo.contador_uso}</div>
      </motion.div>
    );
  } else {
    if (value !== undefined) onChange(undefined);
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
