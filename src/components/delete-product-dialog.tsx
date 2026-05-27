import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = () => {
    if (loading) return;
    setLoading(true);

    withAuth
      .patch(ENDPOINTS.products.detail(productId), { status: 'inactivo' })
      .then((res) => {
        if (res.status === 200) {
          toast.success('El producto se eliminó exitosamente');
          router.invalidate();
        }
      })
      .catch((error) => toast.error(error.response?.data?.detail || error.message))
      .finally(() => setLoading(false));
  };

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
          <AlertDialogAction onClick={handleDelete}>Continuar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
