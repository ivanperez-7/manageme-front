import { Link, useRouterState } from '@tanstack/react-router';
import React from 'react';

import { ModeToggle } from '@/components/theme-toggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { resolveHeaderBreadcrumb } from '@/lib/header';
import { NotificationPopup } from './notification-popup';

export function SiteHeader() {
  const { matches } = useRouterState();
  const match = matches[matches.length - 1];
  const items = resolveHeaderBreadcrumb(match);

  return (
    <header className='flex h-(--header-height) py-2 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mx-2 data-[orientation=vertical]:h-4' />
        <Breadcrumb>
          <BreadcrumbList>
            {items.length > 0 ? (
              items.map((item, i) =>
                item.to && i < items.length - 1 ? (
                  <React.Fragment key={i}>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to={item.to}>{item.label}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </React.Fragment>
                ) : (
                  <BreadcrumbItem key={i}>
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                )
              )
            ) : (
              <BreadcrumbItem>
                <BreadcrumbPage>Home</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <div className='ml-auto flex items-center gap-2'>
          <ModeToggle />
          <NotificationPopup />
        </div>
      </div>
    </header>
  );
}
