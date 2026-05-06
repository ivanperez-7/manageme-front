import { Progress } from '@/components/ui/progress';

export function DeficitProgress({ value, minRequired }: { value: number; minRequired: number }) {
  const progress = Math.min((value / minRequired) * 100, 100);
  const missing = Math.max(minRequired - value, 0);

  return (
    <div className='space-y-2'>
      <Progress value={progress} />

      <div className='text-sm text-muted-foreground'>
        {missing > 0 ? `${missing} more needed to reach ${minRequired}` : 'Minimum reached'}
      </div>
    </div>
  );
}
