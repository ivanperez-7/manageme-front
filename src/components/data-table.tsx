import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  PaginationEllipsis,
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
  pageSize?: number;
  transparent?: boolean;
  hidePagination?: boolean;
  emptyComponent?: React.ReactNode;
  onChangePage?: (pageIndex: number) => void;
  hiddenColumnIds?: string[];
  getRowClassName?: (row: TData) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initialPage,
  pageSize,
  transparent,
  hidePagination,
  emptyComponent,
  onChangePage,
  hiddenColumnIds,
  getRowClassName,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = useState({
    pageIndex: initialPage ?? 0,
    pageSize: pageSize ?? 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const animateRowsRef = useRef(true);

  const table = useReactTable({
    data,
    columns,
    state: { pagination, sorting },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      animateRowsRef.current = false;
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
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    const pageCount = table.getPageCount();
    if (pageCount > 0 && pagination.pageIndex >= pageCount) {
      const clamped = Math.max(0, pageCount - 1);
      setPagination((prev) => ({ ...prev, pageIndex: clamped }));
      onChangePage?.(clamped);
    }
  }, [data]);

  useEffect(() => {
    animateRowsRef.current = true;
  });

  return (
    <>
      <div className={cn(!transparent && 'overflow-hidden rounded-lg border')}>
        <Table>
          <TableHeader className={cn(!transparent && 'bg-muted sticky top-0 z-10')}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(hiddenColumnIds?.includes(header.column.id) && 'hidden md:table-cell')}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type='button'
                        onClick={header.column.getToggleSortingHandler()}
                        className='-ml-1 flex items-center gap-1 rounded px-1 hover:text-foreground'
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? (
                          <ArrowUp className='size-3.5' />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ArrowDown className='size-3.5' />
                        ) : (
                          <ChevronsUpDown className='size-3.5 opacity-40' />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
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
                  initial={animateRowsRef.current ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: animateRowsRef.current ? index * 0.03 : 0, ease: 'easeOut' }}
                  className={cn(
                    'border-b transition-colors hover:bg-muted/50 even:bg-muted/20 data-[state=selected]:bg-muted',
                    getRowClassName?.(row.original)
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn('py-2.5', hiddenColumnIds?.includes(cell.column.id) && 'hidden md:table-cell')}
                    >
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

      {!hidePagination && (
        <div className='grid w-full items-center md:flex md:justify-between text-sm'>
          <div className='text-muted-foreground'>
            Mostrando <strong>{table.getPaginationRowModel().rows.length}</strong> de{' '}
            <strong>{data.length}</strong> registros
          </div>

          <nav className='flex items-center gap-1'>
            <PaginationPrevious
              onClick={() => table.previousPage()}
              className={cn(!table.getCanPreviousPage() && 'pointer-events-none opacity-50')}
            />
            <div className='flex items-center justify-center gap-1 min-w-0'>
              {getPageItems({
                pageIndex: table.getState().pagination.pageIndex,
                pageCount: table.getPageCount(),
              }).map((item, i) =>
                item === ELLIPSIS ? (
                  <PaginationEllipsis key={`ellipsis-${i}`} />
                ) : (
                  <PaginationLink
                    key={item}
                    isActive={table.getState().pagination.pageIndex === item}
                    onClick={() => table.setPageIndex(item)}
                  >
                    {item + 1}
                  </PaginationLink>
                )
              )}
            </div>
            <PaginationNext
              onClick={() => table.nextPage()}
              className={cn(!table.getCanNextPage() && 'pointer-events-none opacity-50')}
            />
          </nav>
        </div>
      )}
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
