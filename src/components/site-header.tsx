import { createContext, useContext, useMemo, useState } from 'react';

import { ModeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationPopup } from './notification-popup';

type SiteHeaderProps = {
  content: React.ReactNode;
  setContent: (content: React.ReactNode) => void;
};

const SiteHeaderContext = createContext<SiteHeaderProps>({
  content: null,
  setContent: () => {
    throw new Error('setContent called outside HeaderProvider');
  },
});

export function useHeader() {
  return useContext(SiteHeaderContext);
}

export function HeaderProvider({ children }: React.PropsWithChildren) {
  const [content, setContent] = useState<React.ReactNode>('Home');
  const value = useMemo(() => ({ content, setContent }), [content]);

  return <SiteHeaderContext.Provider value={value}>{children}</SiteHeaderContext.Provider>;
}

export function SiteHeader() {
  const { content } = useHeader();

  return (
    <header className='flex h-(--header-height) py-2 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mx-2 data-[orientation=vertical]:h-4' />
        <div className='flex items-center text-sm font-medium'>{content || 'Home'}</div>
        <div className='ml-auto flex items-center gap-2'>
          <ModeToggle />
          <NotificationPopup />
        </div>
      </div>
    </header>
  );
}
