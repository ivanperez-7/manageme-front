import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LoginSkeleton() {
  return (
    <div className='relative min-h-svh flex items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <div className='backdrop-blur-xl bg-card/70 border rounded-2xl shadow-2xl p-8 space-y-6'>
          <div className='flex flex-col items-center gap-3'>
            <Skeleton className='size-12 rounded-xl' />
            <div className='text-center space-y-1.5'>
              <Skeleton className='h-6 w-48 mx-auto' />
              <Skeleton className='h-4 w-36 mx-auto' />
            </div>
          </div>
          <div className='space-y-4'>
            <div className='space-y-1.5'>
              <Skeleton className='h-4 w-14' />
              <Skeleton className='h-9 w-full rounded-md' />
            </div>
            <div className='space-y-1.5'>
              <div className='flex justify-between'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-4 w-32' />
              </div>
              <Skeleton className='h-9 w-full rounded-md' />
            </div>
            <div className='space-y-1.5'>
              <Skeleton className='h-4 w-14' />
              <Skeleton className='h-9 w-full rounded-md' />
            </div>
            <Skeleton className='h-9 w-full rounded-md' />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-64' />
      </div>
      <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className='relative overflow-hidden'>
            <Skeleton className='absolute top-0 left-0 w-full h-0.5' />
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='size-9 rounded-lg' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-16 mb-1.5' />
              <Skeleton className='h-3 w-28' />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='grid lg:grid-cols-2 gap-6'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className='h-5 w-56' />
            </CardHeader>
            <CardContent className='h-[300px] flex items-end gap-2 px-6 pb-8'>
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton
                  key={j}
                  className='flex-1 rounded-t-md'
                  style={{ height: `${30 + ((j * 17 + i * 11) % 50)}%` }}
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function CatalogoSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <Skeleton className='h-8 w-56' />
        <Skeleton className='h-4 w-72' />
      </div>
      <div className='flex flex-col gap-2 md:flex-row md:items-center'>
        <Skeleton className='h-9 w-full md:w-80 rounded-md' />
        <Skeleton className='h-9 w-32 rounded-md' />
        <Skeleton className='h-9 w-28 rounded-md' />
        <Skeleton className='h-9 w-28 rounded-md' />
        <Skeleton className='size-9 rounded-md' />
      </div>
      <div className='overflow-hidden rounded-lg border'>
        <div className='bg-muted/50 border-b'>
          <div className='flex gap-4 p-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-4' style={{ width: `${12 + (i * 3) % 10}%` }} />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className='flex gap-4 p-3 border-b last:border-0'>
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton
                key={j}
                className='h-4'
                style={{ width: `${10 + ((j * 7 + i * 5) % 15)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className='flex justify-between items-center'>
        <Skeleton className='h-4 w-44' />
        <div className='flex gap-2'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='size-8 rounded-md' />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <Skeleton className='size-9 rounded-md' />
        <div className='flex items-center gap-2'>
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-4 w-4' />
          <Skeleton className='h-4 w-24' />
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6'>
        <Card>
          <CardHeader>
            <Skeleton className='h-5 w-40' />
          </CardHeader>
          <CardContent className='space-y-4'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='space-y-1'>
                <Skeleton className='h-3 w-24' />
                <Skeleton className='h-5 w-48' />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className='h-5 w-36' />
          </CardHeader>
          <CardContent className='space-y-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='flex items-center gap-3'>
                <Skeleton className='size-8 rounded-full' />
                <div className='space-y-1 flex-1'>
                  <Skeleton className='h-3 w-24' />
                  <Skeleton className='h-3 w-16' />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className='h-5 w-32' />
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <div className='flex gap-4 p-2 border-b'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-4 flex-1' />
              ))}
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='flex gap-4 p-2'>
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className='h-4 flex-1' />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className='h-5 w-48' />
        </CardHeader>
        <CardContent>
          <div className='flex gap-2 mb-4'>
            <Skeleton className='h-9 w-60 rounded-md' />
            <Skeleton className='h-9 w-44 rounded-md' />
          </div>
          <div className='space-y-2'>
            <div className='flex gap-4 p-2 border-b'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-4 flex-1' />
              ))}
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='flex gap-4 p-2'>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className='h-4 flex-1' />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MovementsSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-4 w-72' />
      </div>
      <div className='flex gap-4 items-center'>
        <Skeleton className='h-9 flex-1 rounded-md' />
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Skeleton className='size-4 rounded' />
            <Skeleton className='h-4 w-16' />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='size-4 rounded' />
            <Skeleton className='h-4 w-14' />
          </div>
        </div>
      </div>
      <div className='flex gap-2'>
        <Skeleton className='h-9 w-40 rounded-md' />
        <Skeleton className='h-9 w-40 rounded-md' />
        <Skeleton className='h-7 w-16 rounded-md' />
        <Skeleton className='h-7 w-20 rounded-md' />
        <Skeleton className='h-7 w-16 rounded-md' />
      </div>
      <div className='overflow-hidden rounded-lg border'>
        <div className='bg-muted/50 border-b'>
          <div className='flex gap-4 p-3'>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className='h-4' style={{ width: `${10 + (i * 4) % 12}%` }} />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className='flex gap-4 p-3 border-b last:border-0'>
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton
                key={j}
                className='h-4'
                style={{ width: `${8 + ((j * 5 + i * 3) % 14)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className='flex justify-between items-center'>
        <Skeleton className='h-4 w-44' />
        <div className='flex gap-2'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='size-8 rounded-md' />
          ))}
        </div>
      </div>
    </div>
  );
}

export function MovementDetailSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <Skeleton className='size-9 rounded-md' />
        <Skeleton className='h-8 w-48' />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className='h-5 w-40' />
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-8'>
            <div className='space-y-4'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='space-y-1'>
                  <Skeleton className='h-3 w-28' />
                  <Skeleton className='h-5 w-36' />
                </div>
              ))}
            </div>
            <div className='space-y-4'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='space-y-1'>
                  <Skeleton className='h-3 w-20' />
                  <Skeleton className='h-5 w-48' />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className='h-5 w-48' />
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <div className='flex gap-4 p-2 border-b'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-4 flex-1' />
              ))}
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='flex gap-4 p-2'>
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className='h-4 flex-1' />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      <div className='space-y-1'>
        <Skeleton className='h-8 w-72' />
        <Skeleton className='h-4 w-80' />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className='h-5 w-48' />
        </CardHeader>
        <CardContent className='space-y-6'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='space-y-2'>
              <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
                <div className='space-y-1 flex-1'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3 w-56' />
                </div>
                <div className='flex items-center gap-4'>
                  <Skeleton className='h-9 w-40 rounded-md' />
                </div>
              </div>
              {i < 5 && <div className='h-px bg-border' />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function ClientDetailSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <Skeleton className='size-9 rounded-md' />
        <Skeleton className='h-8 w-48' />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6'>
        <Card>
          <CardHeader>
            <Skeleton className='h-5 w-32' />
          </CardHeader>
          <CardContent className='space-y-4'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='space-y-1'>
                <Skeleton className='h-3 w-20' />
                <Skeleton className='h-9 w-full rounded-md' />
              </div>
            ))}
            <Skeleton className='h-9 w-24 rounded-md' />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className='flex justify-between items-center'>
              <Skeleton className='h-5 w-40' />
              <Skeleton className='h-9 w-36 rounded-md' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className='p-4 space-y-2'>
                    <Skeleton className='h-4 w-28' />
                    <Skeleton className='h-3 w-20' />
                    <Skeleton className='h-3 w-36' />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className='h-5 w-48' />
        </CardHeader>
        <CardContent>
          <div className='flex gap-2 mb-4'>
            <Skeleton className='h-9 w-60 rounded-md' />
            <Skeleton className='h-9 w-44 rounded-md' />
          </div>
          <div className='space-y-2'>
            <div className='flex gap-4 p-2 border-b'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-4 flex-1' />
              ))}
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='flex gap-4 p-2'>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className='h-4 flex-1' />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
