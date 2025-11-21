import Link from 'next/link';

import {
  BarChart3,
  Calendar,
  LayoutDashboard,
  Plus,
  Settings,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Events',
    href: '/dashboard/events',
    icon: Calendar,
  },
  {
    title: 'Create Event',
    href: '/events/create',
    icon: Plus,
  },
  {
    title: 'Artists',
    href: '/dashboard/artists',
    icon: Users,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

interface DashboardSidebarProps {
  currentPath?: string;
}

export function DashboardSidebar({ currentPath = '' }: DashboardSidebarProps) {
  return (
    <aside className="border-border bg-sidebar sticky top-0 hidden h-screen w-64 flex-col border-r lg:flex">
      <div className="border-border border-b p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-primary-foreground text-lg font-bold">D</span>
          </div>
          <span className="text-sidebar-foreground text-lg font-semibold">
            DanceFit
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'text-sidebar-foreground hover:bg-sidebar-accent w-full justify-start gap-3',
                  isActive &&
                    'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
