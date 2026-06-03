import { PackageOpen, Settings } from 'lucide-react';
import * as React from 'react';

import { AddMovementDialog } from './add-movement-dialog';
import { CustomSidebarLink } from './custom-link';
import { NavFooter } from './nav-footer';
import { Button } from './ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from './ui/sidebar';

import navigation from '@/lib/navigation';
import { Kbd, KbdGroup } from './ui/kbd';
import { userStore } from '@/stores/userStore';
import type { UserResponse } from '@/lib/types';

export function AppSidebar({
  onLogout,
  loadingLogout,
  ...props
}: {
  onLogout: React.MouseEventHandler<HTMLDivElement>;
  loadingLogout: boolean;
} & React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className='flex gap-2 mx-2 my-2 items-center'>
          <div className='flex aspect-square size-8 items-center justify-center rounded-lg'>
            <PackageOpen className='size-4' />
          </div>
          <div className='flex flex-col gap-1 leading-none text-sm'>
            <span className='font-medium'>Manejador de inventario</span>
            <span className='text-muted-foreground'>Printcopy</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className='-mb-1.5'>
          <SidebarGroupContent>
            <SidebarMenuItem>
              <AddMovementDialog
                trigger={
                  <Button size='sm' className='w-full'>
                    Registrar movimiento
                    <KbdGroup>
                      <Kbd className='bg-blue-800 text-white'>Ctrl</Kbd>
                      <Kbd className='bg-blue-800 text-white font-extrabold'>⏎</Kbd>
                    </KbdGroup>
                  </Button>
                }
                useShortcut
              />
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarGroup>
        {navigation
          .map((section) => ({
            ...section,
            items: section.items.filter(
              (item) => !item.canRender || item.canRender(userStore.state as UserResponse)
            ),
          }))
          .filter((section) => section.items.length > 0)
          .map((section) => (
            <SidebarGroup key={section.title}>
              {section.title && <SidebarGroupLabel>{section.title}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.content}>
                      <CustomSidebarLink
                        to={item.to}
                        content={item.content}
                        icon={item.icon}
                        onClick={() => setOpenMobile(false)}
                      />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuItem>
          <CustomSidebarLink
            to='/settings'
            content='Configuración'
            icon={<Settings />}
            onClick={() => setOpenMobile(false)}
            hidden={userStore.state.profile?.rol !== 'admin'}
          />
        </SidebarMenuItem>
        <NavFooter user={userStore.state} onLogout={onLogout} loadingLogout={loadingLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
