import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  Play,
  Download,
  Users,
  FileUp,
  BarChart3,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'PL Conso Automation', url: '/automation/pl-conso', icon: Play },
  { title: 'Downloads', url: '/downloads', icon: Download },
  { title: 'Feedback', url: '/feedback', icon: MessageSquare },
];

const adminNavItems = [
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'File Management', url: '/admin/files', icon: FileUp },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Audit Log', url: '/admin/audit', icon: FileText },
  { title: 'Feedback', url: '/admin/feedback', icon: MessageSquare },
];

export function AppSidebar() {
  const { isAdmin } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className={cn("text-sidebar-foreground/70", collapsed && "sr-only")}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className={cn("text-sidebar-foreground/70", collapsed && "sr-only")}>
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
