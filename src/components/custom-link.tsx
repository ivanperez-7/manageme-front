import { createLink } from '@tanstack/react-router';
import type { LinkComponentProps } from '@tanstack/react-router';
import { SidebarMenuButton } from './ui/sidebar';

export const TanStackLinkComponent = createLink(SidebarMenuButton);

type CustomSidebarLinkProps = LinkComponentProps<typeof TanStackLinkComponent> & {
  icon?: React.ReactNode;
  content?: string;
  onClick?: () => void;
};

export const CustomSidebarLink: React.FC<CustomSidebarLinkProps> = ({ icon, content, ...props }) => (
  <TanStackLinkComponent activeProps={{ isActive: true }} {...props}>
    {icon} {content}
  </TanStackLinkComponent>
);
