import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { cn } from '@/lib/utils';

export function DateRangePicker({
  defaultStartDate,
  defaultEndDate,
  onStartDateChange,
  onEndDateChange,
  className,
  startLabel = 'Fecha de inicio',
  endLabel = 'Fecha de fin',
}: {
  defaultStartDate?: Date;
  defaultEndDate?: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  className?: string;
  startLabel?: string;
  endLabel?: string;
}) {
  const [startDate, setStartDate] = useState<Date>(defaultStartDate || new Date());
  const [endDate, setEndDate] = useState<Date>(defaultEndDate || new Date());

  return (
    <div className={cn('flex flex-col md:flex-row gap-4', className)}>
      {/* Start Date */}
      <div className='flex gap-2 items-center'>
        <label className='text-sm font-medium'>{startLabel}</label>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={cn(
                'w-60 justify-start text-left font-normal',
                !startDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className='mr-2 h-4 w-4' />
              {startDate ? format(startDate, 'PPP', { locale: es }) : <span>Escoge una fecha</span>}
            </Button>
          </PopoverTrigger>

          <PopoverContent className='w-auto p-0'>
            <Calendar
              mode='single'
              selected={startDate}
              onSelect={(date) => {
                setStartDate(date);
                onStartDateChange(date);
              }}
              required
              locale={es}
              disabled={(date) => (endDate ? date > endDate : false)}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* End Date */}
      <div className='flex gap-2 ml-9 items-center'>
        <label className='text-sm font-medium'>{endLabel}</label>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={cn(
                'w-60 justify-start text-left font-normal',
                !endDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className='mr-2 h-4 w-4' />
              {endDate ? format(endDate, 'PPP', { locale: es }) : <span>Escoge una fecha</span>}
            </Button>
          </PopoverTrigger>

          <PopoverContent className='w-auto p-0'>
            <Calendar
              mode='single'
              selected={endDate}
              onSelect={(date) => {
                setEndDate(date);
                onEndDateChange(date);
              }}
              required
              locale={es}
              disabled={(date) => (startDate ? date < startDate : false)}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
