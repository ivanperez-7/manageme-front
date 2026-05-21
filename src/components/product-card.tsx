import { motion } from 'framer-motion';
import { EllipsisVertical } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { AddProductDialog } from '@/components/add-product-dialog';
import { DeleteProductDialog } from '@/components/delete-product-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import type { ProductoResponse } from '@/lib/types';
import { plural, statusFromStock } from '@/lib/utils';

export function ProductCard({ producto }: { producto: ProductoResponse }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
    <Card className='w-full max-w-md rounded-xl shadow-sm border'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>
          <Link to='/catalogo/$id' params={{ id: String(producto.id) }}>
            {producto.descripcion}
          </Link>
        </CardTitle>
        <CardDescription className='text-sm text-muted-foreground font-medium'>
          {producto.codigo_interno}
        </CardDescription>
      </CardHeader>

      <CardContent className='grid gap-3 text-sm'>
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>Proveedor</span>
          <span className='font-medium'>{producto.proveedor?.nombre ?? '—'}</span>
        </div>

        <div className='flex justify-between'>
          <span className='text-muted-foreground'>Existencia</span>
          <span className='font-medium'>{plural('unidad', producto.cantidad_disponible)}</span>
        </div>

        <div className='flex justify-between'>
          <span className='text-muted-foreground'>Estado</span>

          <Tooltip>
            <TooltipTrigger>
              {statusFromStock(producto.cantidad_disponible, producto.min_stock)}
            </TooltipTrigger>

            <TooltipContent>
              <span className='font-medium'>Min requerido:</span>{' '}
              {plural('unidad', producto.min_stock)}
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>

      <CardFooter className='flex justify-end'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='text-muted-foreground data-[state=open]:bg-muted'
            >
              <EllipsisVertical className='h-5 w-5' />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align='end' className='w-40'>
            <AddProductDialog
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>
              }
              producto={producto}
            />
            <DropdownMenuItem>Marcar favorito</DropdownMenuItem>
            <DeleteProductDialog
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} variant='destructive'>
                  Eliminar
                </DropdownMenuItem>
              }
              productId={producto.id}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
    </motion.div>
  );
}
