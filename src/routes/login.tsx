import { createFileRoute, useRouter } from '@tanstack/react-router';
import axios from 'axios';
import Cookies from 'js-cookie';
import { PackageOpen } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import z from 'zod';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

import { API_BASE, ENDPOINTS } from '@/api/endpoints';
import { getSucursales } from '@/api/organizacion';
import { useAppForm } from '@/hooks/use-app-form';
import { withAuth } from '@/lib/auth';
import { authActions } from '@/stores/authStore';
import { userActions } from '@/stores/userStore';

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(3),
  branch: z.number().gt(0),
});

export const Route = createFileRoute('/login')({
  loader: async () => await getSucursales(),
  validateSearch: ({ redirect }) => ({
    redirect: (redirect as string) || undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { theme } = useTheme();

  return (
    <div className='bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col items-center gap-2'>
            <PackageOpen className='size-6 mb-1' />
            <h1 className='text-xl font-bold'>Bienvenido de vuelta</h1>
            <FieldDescription>
              ¿Aún no tiene acceso? <a href='#'>Regístrese.</a>
            </FieldDescription>
          </div>
          <LoginForm />
        </div>
      </div>
      <Toaster position='top-center' richColors theme={theme} />
    </div>
  );
}

function LoginForm() {
  const { redirect } = Route.useSearch();
  const sucursales = Route.useLoaderData();
  const router = useRouter();

  const form = useAppForm({
    defaultValues: {
      username: '',
      password: '',
      branch: 0,
    },
    validators: {
      onSubmit: loginSchema,
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await axios
          .post(ENDPOINTS.auth.login, value, { baseURL: API_BASE, withCredentials: true })
          .then((res) => authActions.setAccessToken(res.data.access));

        // Obtener información del usuario después de iniciar sesión
        await withAuth.get(ENDPOINTS.auth.me).then((res) => userActions.setUserInfo(res.data));

        if (redirect) router.history.replace(redirect);
        else router.navigate({ to: '/dashboard' });
      } catch (error: any) {
        toast.error(
          error.response ? error.response.data.detail || 'Error' : 'No se pudo conectar al servidor'
        );
      }
    },
  });

  return (
    <form
      id='login-form'
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name='username'>
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Usuario</FieldLabel>
              <Input
                tabIndex={1}
                id={field.name}
                type='text'
                placeholder='usuario_07'
                autoComplete='username'
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value.toLocaleLowerCase())}
                onBlur={field.handleBlur}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name='password'>
          {(field) => (
            <Field>
              <div className='flex items-center'>
                <FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
                <a href='#' className='ml-auto text-sm underline-offset-2 hover:underline'>
                  ¿Olvidó su contraseña?
                </a>
              </div>
              <Input
                tabIndex={2}
                id={field.name}
                type='password'
                placeholder='********'
                autoComplete='current-password'
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            </Field>
          )}
        </form.Field>

        <form.AppField name='branch'>
          {(Field) => (
            <Field.NumberSelectField
              label='Sucursal'
              placeholder='Pensiones'
              hideErrors
              options={sucursales.map((suc) => ({
                key: suc.id.toString(),
                value: suc.id,
                label: suc.nombre,
              }))}
              onValueChange={(v) => Cookies.set('branch', v, { path: '/' })}
            />
          )}
        </form.AppField>

        <form.Subscribe selector={(state) => [state.isSubmitting, state.canSubmit]}>
          {([isSubmitting, canSubmit]) => (
            <Button tabIndex={3} type='submit' form='login-form' disabled={isSubmitting || !canSubmit}>
              {isSubmitting && <Spinner />} Iniciar sesión
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
