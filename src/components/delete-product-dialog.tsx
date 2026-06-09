import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { ENDPOINTS } from '@/api/endpoints';
import { withAuth } from '@/lib/auth';

export function DeleteProductDialog({
  trigger,
  productId,
}: {
  trigger: React.ReactNode;
  productId: number;
}) {
  const router = useRouter();

  const deleteMutation = useMutation({
    mutationFn: () => withAuth.patch(ENDPOINTS.products.detail(productId), { status: 'inactivo' }),
    onSuccess: () => {
      toast.success('El producto se eliminó exitosamente');
      router.invalidate();
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || error.message),
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
          <AlertDialogDescription>
            Está a punto de eliminar este producto. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
