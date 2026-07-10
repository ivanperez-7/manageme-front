import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import axios from 'axios';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import { Building2, Lock, PackageOpen, User } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import z from 'zod';

import { LoginSkeleton } from '@/components/route-skeletons';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

import { API_BASE, ENDPOINTS } from '@/api/endpoints';
import { getSucursales } from '@/api/organizacion';
import { useAppForm } from '@/hooks/use-app-form';
import { checkAuth, withAuth } from '@/lib/auth';
import { authActions } from '@/stores/authStore';
import { userActions } from '@/stores/userStore';

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(3),
  branch: z.number().gt(0),
});

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const logged = await checkAuth();
    if (logged) throw redirect({ to: '/dashboard' });
  },
  loader: async () => await getSucursales(),
  validateSearch: ({ redirect }) => ({
    redirect: (redirect as string) || undefined,
  }),
  component: LoginPage,
  pendingComponent: LoginSkeleton,
  pendingMs: 200,
});

function LoginPage() {
  const { theme } = useTheme();

  return (
    <div className='relative min-h-svh flex items-center justify-center p-6 md:p-10 overflow-hidden bg-linear-to-br from-background via-background to-primary/5'>
      {/* Grid pattern overlay */}
      <div
        className='absolute inset-0 opacity-[0.04] pointer-events-none'
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Decorative blurred orbs */}
      <div className='absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none' />
      <div className='absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none' />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className='w-full max-w-sm'
      >
        <div className='backdrop-blur-xl bg-card/70 border rounded-2xl shadow-2xl p-8 space-y-6'>
          <div className='flex flex-col items-center gap-3'>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.12, type: 'spring', stiffness: 200, damping: 15 }}
              className='size-12 rounded-xl bg-primary/10 flex items-center justify-center'
            >
              <PackageOpen className='size-6 text-primary' />
            </motion.div>
            <div className='text-center'>
              <h1 className='text-xl font-semibold tracking-tight'>Bienvenido de vuelta</h1>
            </div>
          </div>

          <LoginForm />
        </div>
      </motion.div>

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
      branch: 1,
    },
    validators: {
      onSubmit: loginSchema,
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      Cookies.set('branch', value.branch.toString(), { path: '/' });
      try {
        await axios
          .post(ENDPOINTS.auth.login, value, { baseURL: API_BASE, withCredentials: true })
          .then((res) => authActions.setAccessToken(res.data.access));

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
        <motion.div
          initial='hidden'
          animate='visible'
          variants={{
            visible: { transition: { staggerChildren: 0.06, delayChildren: 0.18 } },
          }}
          className='space-y-4'
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
            <form.Field name='username'>
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Usuario</FieldLabel>
                  <div className='relative'>
                    <User className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none' />
                    <Input
                      tabIndex={1}
                      id={field.name}
                      type='text'
                      placeholder='usuario_07'
                      autoComplete='username'
                      className='pl-9'
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value.toLocaleLowerCase())}
                      onBlur={field.handleBlur}
                    />
                  </div>
                </Field>
              )}
            </form.Field>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
            <form.Field name='password'>
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none' />
                    <Input
                      tabIndex={2}
                      id={field.name}
                      type='password'
                      placeholder='********'
                      autoComplete='current-password'
                      className='pl-9'
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                </Field>
              )}
            </form.Field>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
            <form.Field name='branch'>
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Sucursal</FieldLabel>
                  <div className='relative'>
                    <Building2 className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10' />
                    <Select value={String(field.state.value || '')}>
                      <SelectTrigger id={field.name} className='pl-9 w-full'>
                        <SelectValue placeholder='Pensiones' />
                      </SelectTrigger>
                      <SelectContent>
                        {sucursales.length > 0 ? (
                          sucursales.map((suc) => (
                            <SelectItem key={suc.id} value={String(suc.id)}>
                              {suc.nombre}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value='0'>No hay opciones</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </Field>
              )}
            </form.Field>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
            <form.Subscribe selector={(state) => [state.isSubmitting, state.canSubmit]}>
              {([isSubmitting, canSubmit]) => (
                <Button
                  tabIndex={3}
                  type='submit'
                  form='login-form'
                  disabled={isSubmitting || !canSubmit}
                  className='w-full font-medium shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/25 transition-all duration-300'
                >
                  {isSubmitting && <Spinner />}
                  Iniciar sesión
                </Button>
              )}
            </form.Subscribe>
          </motion.div>
        </motion.div>
      </FieldGroup>
    </form>
  );
}
