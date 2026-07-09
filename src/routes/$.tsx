import { createFileRoute, Link } from '@tanstack/react-router';
import { Compass } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className='flex min-h-svh items-center justify-center p-6'>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant='decorative'>
            <Compass />
          </EmptyMedia>
          <EmptyTitle>Página no encontrada</EmptyTitle>
          <EmptyDescription>
            La página que buscas no existe o fue movida.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to='/dashboard'>Volver al inicio</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
