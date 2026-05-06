import { Progress } from '@/components/ui/progress';

export function RemainingProgress({ total, remaining }: { total: number; remaining: number }) {
  const safeRemaining = Math.max(remaining, 0);
  const percentRemaining = total > 0 ? (safeRemaining / total) * 100 : 0;

  return (
    <div className='space-y-2'>
      <Progress value={percentRemaining} />

      <div className='text-sm text-muted-foreground'>
        {safeRemaining > 0 ? `${safeRemaining} restantes de ${total}` : `0 restantes de ${total}`}
      </div>
    </div>
  );
}
