import { createFileRoute, ErrorComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/suppliers')({
  staticData: { headerBreadcrumb: [{ label: 'Proveedores' }] },
  component: SuppliersPage,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

function SuppliersPage() {
  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-semibold tracking-tight'>Proveedores</h1>
        <p className='text-muted-foreground'>Administra los proveedores registrados.</p>
      </div>
    </div>
  );
}
