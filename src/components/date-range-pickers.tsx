import { endOfMonth, endOfToday, format, startOfMonth, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { cn } from '@/lib/utils';

export function DateRangePicker({
  minDate,
  defaultStartDate,
  defaultEndDate,
  onStartDateChange,
  onEndDateChange,
  className,
  startLabel = 'Fecha de inicio',
  endLabel = 'Fecha de fin',
}: {
  minDate?: Date;
  defaultStartDate?: Date;
  defaultEndDate?: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  className?: string;
  startLabel?: string;
  endLabel?: string;
}) {
  const initialStartDate = defaultStartDate || new Date();
  const initialEndDate = defaultEndDate || new Date();

  const [startDate, setStartDate] = useState<Date>(initialStartDate);
  const [endDate, setEndDate] = useState<Date>(initialEndDate);

  // Controlled visible calendar months
  const [startMonth, setStartMonth] = useState<Date>(initialStartDate);
  const [endMonth, setEndMonth] = useState<Date>(initialEndDate);

  const updateRange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);

    // Sync visible months
    setStartMonth(start);
    setEndMonth(end);

    onStartDateChange(start);
    onEndDateChange(end);
  };

  const handleToday = () => {
    updateRange(startOfToday(), endOfToday());
  };

  const handleThisFortnight = () => {
    const today = new Date();

    const start =
      today.getDate() <= 15
        ? new Date(today.getFullYear(), today.getMonth(), 1)
        : new Date(today.getFullYear(), today.getMonth(), 16);

    const end =
      today.getDate() <= 15 ? new Date(today.getFullYear(), today.getMonth(), 15) : endOfMonth(today);

    updateRange(start, end);
  };

  const handleThisMonth = () => {
    updateRange(startOfMonth(new Date()), endOfMonth(new Date()));
  };

  return (
    <div className={cn('flex flex-col lg:flex-row lg:items-center gap-6', className)}>
      {/* Date pickers */}
      <div className='flex flex-col md:flex-row gap-4'>
        {/* Start Date */}
        <div className='flex gap-2 items-center'>
          <label className='text-sm font-medium whitespace-nowrap'>{startLabel}</label>

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

                {startDate ? (
                  format(startDate, 'PPP', {
                    locale: es,
                  })
                ) : (
                  <span>Escoge una fecha</span>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent className='w-auto p-0'>
              <Calendar
                mode='single'
                locale={es}
                required
                selected={startDate}
                month={startMonth}
                onMonthChange={setStartMonth}
                disabled={(date) =>
                  (endDate ? date > endDate : false) || (minDate ? date < minDate : false)
                }
                onSelect={(date) => {
                  if (!date) return;

                  setStartDate(date);
                  setStartMonth(date);

                  onStartDateChange(date);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div className='flex gap-2 items-center'>
          <label className='text-sm font-medium whitespace-nowrap'>{endLabel}</label>

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

                {endDate ? (
                  format(endDate, 'PPP', {
                    locale: es,
                  })
                ) : (
                  <span>Escoge una fecha</span>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent className='w-auto p-0'>
              <Calendar
                mode='single'
                locale={es}
                required
                selected={endDate}
                month={endMonth}
                onMonthChange={setEndMonth}
                disabled={(date) =>
                  (startDate ? date < startDate || date > new Date() : false) ||
                  (minDate ? date < minDate : false)
                }
                onSelect={(date) => {
                  if (!date) return;

                  setEndDate(date);
                  setEndMonth(date);

                  onEndDateChange(date);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Presets */}
      <div className='flex flex-wrap gap-2'>
        <Button className='text-xs' variant='secondary' size='sm' onClick={handleToday}>
          Hoy
        </Button>

        <Button className='text-xs' variant='secondary' size='sm' onClick={handleThisFortnight}>
          Esta quincena
        </Button>

        <Button className='text-xs' variant='secondary' size='sm' onClick={handleThisMonth}>
          Este mes
        </Button>
      </div>
    </div>
  );
}
