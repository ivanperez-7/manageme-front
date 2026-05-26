import { motion } from 'framer-motion';
import type React from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function MovementScanInput({
  tipo,
  scanCode,
  onScanCodeChange,
  searching,
  onSubmit,
  scanInputRef,
}: {
  tipo: 'entrada' | 'salida';
  scanCode: string;
  onScanCodeChange: (value: string) => void;
  searching: boolean;
  onSubmit: (e: React.FormEvent) => void;
  scanInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <FieldSet>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='scan-input'>
            {tipo === 'entrada' ? 'SKU del producto' : 'Código de lote'}
          </FieldLabel>
          <div className='flex gap-2'>
            <Input
              id='scan-input'
              ref={scanInputRef}
              value={scanCode}
              autoFocus
              autoComplete='off'
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              onChange={(e) => onScanCodeChange(e.target.value)}
              placeholder={
                tipo === 'entrada'
                  ? 'Escanee o escriba el SKU...'
                  : 'Escanee o escriba el código de lote...'
              }
            />
            <Button type='button' disabled={searching || !scanCode.trim()} onClick={onSubmit}>
              {searching ? (
                <motion.span
                  className='flex items-center gap-2'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Buscando...
                </motion.span>
              ) : (
                'Agregar'
              )}
            </Button>
          </div>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
