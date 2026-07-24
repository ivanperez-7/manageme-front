import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { useMemo, useState, type Key } from 'react';
import { ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const { fieldContext, formContext, useFormContext, useFieldContext } = createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InputField, NumberSelectField, SearchableSelectField },
  formComponents: { SaveButton },
});

export function InputField({
  label,
  readOnly,
  numeric,
  ...props
}: { label: string; readOnly?: boolean; numeric?: boolean } & React.ComponentProps<'input'>) {
  const field = useFieldContext<string>();
  return (
    <Field className='space-y-1'>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      {readOnly ? (
        <span>{field.state.value || '—'}</span>
      ) : (
        <Input
          id={field.name}
          value={field.state.value ?? ''}
          onChange={(e) => {
            const value = numeric ? e.target.value.replace(/\D/g, '') : e.target.value;
            field.handleChange(value);
          }}
          {...props}
        />
      )}
      <FieldError errors={field.state.meta.errors} />
    </Field>
  );
}

export function NumberSelectField({
  label,
  placeholder,
  options,
  onValueChange,
  disabled,
  loading,
  hideErrors,
}: {
  label?: string;
  placeholder: string;
  options: { key: Key; value: number; label: string }[];
  onValueChange?: (v: string) => void;
  disabled?: boolean;
  loading?: boolean;
  hideErrors?: boolean;
}) {
  const field = useFieldContext<number>();
  return (
    <Field className='space-y-1'>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Select
        value={String(field.state.value || '')}
        onValueChange={(v) => {
          field.handleChange(Number(v));
          if (onValueChange) onValueChange(v);
        }}
        disabled={disabled || loading}
      >
        <SelectTrigger id={field.name}>
          {loading && <Spinner className='mr-1' />}
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.length > 0 ? (
            options.map((opt) => (
              <SelectItem key={opt.key} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))
          ) : (
            <SelectItem value='0'>No hay opciones</SelectItem>
          )}
        </SelectContent>
      </Select>
      <FieldError hidden={hideErrors} errors={field.state.meta.errors} />
    </Field>
  );
}

type Option = { key: Key; value: number; label: string };

export function SearchableSelectField({
  label,
  placeholder,
  options,
  onValueChange,
  disabled,
  loading,
}: {
  label?: string;
  placeholder: string;
  options: Option[];
  onValueChange?: (v: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const field = useFieldContext<number>();
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => options.find((o) => o.value === field.state.value),
    [field.state.value, options]
  );

  return (
    <Field className='space-y-1'>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={field.name}
            role='combobox'
            aria-expanded={open}
            disabled={disabled || loading}
            className={cn(
              'border-input data-placeholder:text-muted-foreground [&_svg:not([class*="text-"])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
              !selected && 'text-muted-foreground'
            )}
          >
            {loading && <Spinner className='mr-1' />}
            {selected ? selected.label : placeholder}
            <ChevronsUpDown className='opacity-50' />
          </button>
        </PopoverTrigger>
        <PopoverContent className='w-(--radix-popover-trigger-width) p-0' align='start'>
          <Command>
            <CommandInput placeholder={`Buscar ${placeholder.toLowerCase()}...`} />
            <CommandEmpty className='py-6 text-center text-sm'>No encontrado.</CommandEmpty>
            <CommandGroup className='max-h-64 overflow-auto'>
              {options.map((opt) => (
                <CommandItem
                  key={opt.key}
                  value={opt.label}
                  disabled={opt.value === 0}
                  onSelect={() => {
                    field.handleChange(opt.value);
                    if (onValueChange) onValueChange(String(opt.value));
                    setOpen(false);
                  }}
                >
                  {opt.label}
                  {opt.value === field.state.value && (
                    <span className='ml-auto text-xs text-muted-foreground'>Seleccionado</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <FieldError errors={field.state.meta.errors} />
    </Field>
  );
}

export function SaveButton({ label, ...props }: React.ComponentProps<'button'> & { label?: string }) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button
          type='submit'
          disabled={isSubmitting || props.disabled}
          className='w-full md:w-auto'
          {...props}
        >
          {isSubmitting && <Spinner />} {label || 'Guardar'}
        </Button>
      )}
    </form.Subscribe>
  );
}
