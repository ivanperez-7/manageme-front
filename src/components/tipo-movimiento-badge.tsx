import { motion } from 'framer-motion';
import { ArrowDownToDot, ArrowUpFromDot } from 'lucide-react';

import { Badge } from './ui/badge';

export default function TipoMovimientoBadge({ tipo }: { tipo: 'entrada' | 'salida' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className='inline-flex'
    >
      {tipo === 'entrada' ? (
        <Badge variant='default'>
          <ArrowDownToDot />
          Entrada
        </Badge>
      ) : (
        <Badge variant='destructive'>
          <ArrowUpFromDot />
          Salida
        </Badge>
      )}
    </motion.div>
  );
}
