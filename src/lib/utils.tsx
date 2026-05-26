import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function humanDate(iso?: string) {
  if (!iso) return '';
  try {
    return format(new Date(iso), 'eee., dd MMM yyyy', { locale: es });
  } catch {
    return iso;
  }
}

export function humanTime(iso?: string) {
  if (!iso) return '';
  try {
    return format(new Date(iso), 'h:mm aaaa', { locale: es });
  } catch {
    return iso;
  }
}

export function statusFromStock(stock: number, min_stock: number) {
  if (stock === 0) return <Badge variant='destructive'>Agotado</Badge>;
  if (stock < min_stock)
    return (
      <Badge variant='default' className='bg-orange-500 dark:bg-orange-700'>
        Bajo en stock
      </Badge>
    );
  return (
    <Badge
      variant='outline'
      className='border-green-500 text-green-600 dark:border-green-700 dark:text-green-400'
    >
      Disponible
    </Badge>
  );
}

export function plural(word: string, count: number) {
  let pluralWord;
  if (count === 1) pluralWord = word;
  else if (/[aeiouáéíóú]$/i.test(word)) pluralWord = word + 's';
  else if (/[bcdfghjklmnñpqrstvwxyz]$/i.test(word)) pluralWord = word + 'es';
  else pluralWord = word + 's';

  // Spanish accent rules: replace -ón/-án with -ones/-anes
  pluralWord = pluralWord.replace(/ónes$/, 'ones').replace(/ánes$/, 'anes');

  return `${count.toLocaleString('es-MX')} ${pluralWord}`;
}

export function firstUpperCase(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
