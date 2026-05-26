import type { ColumnDef } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

import { cn } from '@/lib/utils';

const ELLIPSIS = -1;

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  initialPage?: number;
  transparent?: boolean;
  emptyComponent?: React.ReactNode;
  onChangePage?: (pageIndex: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initialPage,
  transparent,
  emptyComponent,
  onChangePage,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = useState({
    pageIndex: initialPage ?? 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: (updater) => {
      setPagination((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        onChangePage?.(next.pageIndex);
        return next;
      });
    },
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    const pageCount = table.getPageCount();
    if (pageCount > 0 && pagination.pageIndex >= pageCount) {
      const clamped = Math.max(0, pageCount - 1);
      setPagination((prev) => ({ ...prev, pageIndex: clamped }));
      onChangePage?.(clamped);
    }
  }, [data]);

  return (
    <>
      <div className={cn(!transparent && 'overflow-hidden rounded-lg border')}>
        <Table>
          <TableHeader className={cn(!transparent && 'bg-muted sticky top-0 z-10')}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <motion.tr
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03, ease: 'easeOut' }}
                  className='border-b transition-colors hover:bg-muted/50 even:bg-muted/20 data-[state=selected]:bg-muted'
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className='py-2.5'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  {emptyComponent || <span className='h-24 text-center'>No results.</span>}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='grid w-full items-center md:flex md:justify-between text-sm'>
        {/* Contador */}
        <div className='text-muted-foreground'>
          Mostrando <strong>{table.getPaginationRowModel().rows.length}</strong> de{' '}
          <strong>{data.length}</strong> registros
        </div>

        {/* Paginación */}
        <Pagination className='mx-auto md:mx-0'>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                className={cn(!table.getCanPreviousPage() && 'pointer-events-none opacity-50')}
              />
            </PaginationItem>

            {getPageItems({
              pageIndex: table.getState().pagination.pageIndex,
              pageCount: table.getPageCount(),
            }).map((item, i) => {
              if (item === ELLIPSIS) {
                return (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return (
                <PaginationItem key={item}>
                  <PaginationLink
                    isActive={table.getState().pagination.pageIndex === item}
                    onClick={() => table.setPageIndex(item)}
                  >
                    {item + 1}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                className={cn(!table.getCanNextPage() && 'pointer-events-none opacity-50')}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
}

/** Devuelve un array como: `[0, -1, 5, 6, 7, -1, 20]` */
function getPageItems({ pageIndex, pageCount }: { pageIndex: number; pageCount: number }) {
  const pages = [];

  // Mostrar siempre la primera página
  pages.push(0);

  // Mostrar -1 si estás lejos del inicio
  if (pageIndex > 2) {
    pages.push(ELLIPSIS);
  }

  // Páginas cercanas a la actual
  for (let i = pageIndex - 1; i <= pageIndex + 1; i++) {
    if (i > 0 && i < pageCount - 1) {
      pages.push(i);
    }
  }

  // Mostrar -1 antes del final
  if (pageIndex < pageCount - 3) {
    pages.push(ELLIPSIS);
  }

  // Última página
  if (pageCount > 1) {
    pages.push(pageCount - 1);
  }

  return pages;
}
