import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import type { Key } from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

const { fieldContext, formContext, useFormContext, useFieldContext } = createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InputField, NumberSelectField },
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
