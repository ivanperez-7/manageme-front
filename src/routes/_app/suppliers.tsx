import { createFileRoute } from '@tanstack/react-router';
import { ErrorState } from '@/components/error-state';

export const Route = createFileRoute('/_app/suppliers')({
  staticData: { headerBreadcrumb: [{ label: 'Proveedores' }] },
  component: SuppliersPage,
  errorComponent: ErrorState,
});

function SuppliersPage() {
  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>Proveedores</h1>
        <p className='text-muted-foreground'>Administra los proveedores registrados.</p>
      </div>
    </div>
  );
}
