import type { Link, LinkComponentProps } from '@tanstack/react-router';
import {
  ArrowLeftRight,
  BookUser,
  History,
  LayoutDashboard,
  Package2,
  Printer,
  RefreshCw,
  Sparkles,
  TruckIcon,
} from 'lucide-react';

import type { UserResponse } from './types';

type NavItem = LinkComponentProps<typeof Link> & {
  content: string;
  icon?: React.ReactNode;
  canRender?: (user: UserResponse) => boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navigation: NavSection[] = [
  {
    title: '',
    items: [
      { to: '/dashboard', content: 'Dashboard', icon: <LayoutDashboard /> },
      { to: '/chatbot', content: 'Asistente IA', icon: <Sparkles /> },
    ],
  },
  {
    title: 'Catálogos',
    items: [
      { to: '/catalogo', content: 'Productos', icon: <Package2 /> },
      { to: '/equipos', content: 'Equipos', icon: <Printer /> },
      { to: '/clients', content: 'Clientes', icon: <BookUser /> },
      { to: '/suppliers', content: 'Proveedores', icon: <TruckIcon /> },
    ],
  },
  {
    title: 'Movimientos',
    items: [
      { to: '/movements', content: 'Ver movimientos', icon: <ArrowLeftRight /> },
      {
        to: '/reorden',
        content: 'Pedidos sugeridos',
        icon: <RefreshCw />,
        canRender: (user) => user.profile?.rol === 'admin',
      },
    ],
  },
  {
    title: 'Sistema',
    items: [
      {
        to: '/actividades',
        content: 'Registro de actividades',
        icon: <History />,
        canRender: (user) => user.profile?.rol === 'admin',
      },
    ],
  },
];

export default navigation;
