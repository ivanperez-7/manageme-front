import type { ErrorComponentProps } from '@tanstack/react-router';
import { useRouter } from '@tanstack/react-router';
import { TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

/** Branded, retryable error screen. Use as a route `errorComponent`. */
export function ErrorState({ error, reset }: Partial<ErrorComponentProps>) {
  const router = useRouter();

  return (
    <Empty className='my-8'>
      <EmptyHeader>
        <EmptyMedia variant='decorative'>
          <TriangleAlert className='text-destructive' />
        </EmptyMedia>
        <EmptyTitle>Algo salió mal</EmptyTitle>
        <EmptyDescription>
          No se pudo cargar esta sección. Inténtalo de nuevo.
          {error?.message && (
            <span className='mt-2 block font-mono text-xs opacity-70'>{error.message}</span>
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          onClick={() => {
            reset?.();
            router.invalidate();
          }}
        >
          Reintentar
        </Button>
      </EmptyContent>
    </Empty>
  );
}
