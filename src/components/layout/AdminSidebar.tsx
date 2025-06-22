
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookUser, Settings, QrCode, UsersRound, Users as UsersIcon, Building2 as DepartmentIcon, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarContent as ShadSidebarContent,
  SidebarHeader as ShadSidebarHeader,
  SidebarFooter as ShadSidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/shared/Logo';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/useAuth'; 

const navItemsBase = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard Overview' },
  { href: '/admin/attendance', label: 'Attendance', icon: BookUser, tooltip: 'Manage Attendance Records' },
  { href: '/admin/students', label: 'Students', icon: UsersRound, tooltip: 'Manage Students' }, 
];

const adminOnlyNavItems = [
  { href: '/admin/users', label: 'Users', icon: UsersIcon, tooltip: 'Manage Users (Admin)' },
  { href: '/admin/departments', label: 'Departments', icon: DepartmentIcon, tooltip: 'Manage Departments (Admin)' },
  { href: '/admin/activity-log', label: 'Activity Log', icon: History, tooltip: 'View User Activity (Admin)' },
];

const navItemsSettings = [
  { href: '/admin/settings', label: 'Settings', icon: Settings, tooltip: 'Application Settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { currentUserRole } = useAuth(); 

  let navItems = [...navItemsBase];
  if (currentUserRole === 'Admin') {
    navItems.push(...adminOnlyNavItems);
  }
  navItems.push(...navItemsSettings);


  return (
    <>
      <ShadSidebarHeader className="border-b border-sidebar-border p-4">
        <Logo size="md" iconColorClass="text-sidebar-foreground" textColorClass="text-sidebar-foreground" />
      </ShadSidebarHeader>
      <ShadSidebarContent className="p-4">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))}
                  tooltip={{children: item.tooltip, side: 'right', className: "bg-popover text-popover-foreground"}}
                  className={cn(
                    "w-full justify-start",
                    (pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)))
                      ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3 shrink-0" />
                  <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </ShadSidebarContent>
      <SidebarSeparator />
      <ShadSidebarFooter className="p-4 mt-auto">
        <Link href="/scan" passHref legacyBehavior>
            <Button variant="outline" className="w-full bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 group-data-[collapsible=icon]:px-2">
                <QrCode className="h-5 w-5 mr-0 md:mr-2 group-data-[collapsible=icon]:mr-0 shrink-0"/>
                <span className="truncate group-data-[collapsible=icon]:hidden">Go to Scanner</span>
            </Button>
        </Link>
      </ShadSidebarFooter>
    </>
  );
}
