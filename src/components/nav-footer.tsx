import { LogOut } from 'lucide-react';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

import type { UserResponse } from '@/lib/types';
import { Spinner } from './ui/spinner';

export function NavFooter({
  user,
  onLogout,
  loadingLogout,
}: {
  user: UserResponse;
  onLogout: () => void;
  loadingLogout: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <SidebarMenuButton size='lg'>
              <Avatar className='h-8 w-8 rounded-lg'>
                <AvatarImage src={user.profile?.avatar ?? undefined} alt={user.full_name} />
                <AvatarFallback className='rounded-lg'>
                  {user.full_name[0].toLocaleUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium'>{user.full_name}</span>
                <span className='truncate text-xs'>{user.email}</span>
              </div>
            </SidebarMenuButton>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cerrar sesión</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que deseas cerrar sesión?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant='destructive'
                disabled={loadingLogout}
                onClick={() => {
                  onLogout();
                  setOpen(false);
                }}
              >
                {loadingLogout ? <Spinner /> : <LogOut />}
                Cerrar sesión
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
