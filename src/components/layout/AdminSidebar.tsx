
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookUser, Settings, QrCode, UsersRound, Users as UsersIcon, History, ShieldCheck, ShieldAlert, ListOrdered } from 'lucide-react';
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
import type { PermissionKey } from '@/types/permissions';

export function AdminSidebar() {
  const pathname = usePathname();
  const { currentUser } = useAuth(); 

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard Overview', permission: 'canReadDashboard' },
    { href: '/admin/attendance', label: 'Attendance', icon: BookUser, tooltip: 'Manage Attendance Records', permission: 'canReadAttendance' },
    { href: '/admin/students', label: 'Students', icon: UsersRound, tooltip: 'Manage Students', permission: 'canReadStudents' },
    { href: '/admin/users', label: 'Users', icon: UsersIcon, tooltip: 'Manage Users (Admin)', permission: 'canReadUsers' },
    { href: '/admin/activity-log', label: 'Activity Log', icon: History, tooltip: 'View User Activity', permission: 'canReadActivityLog' },
  ];

  const bottomNavItems = [
     { href: '/admin/super-settings', label: 'Site Settings', icon: ShieldAlert, tooltip: 'Manage Site Settings (Super Admin)', permission: 'canManageSiteSettings' },
     { href: '/admin/profile/my-permissions', label: 'My Permissions', icon: ShieldCheck, tooltip: 'View Your Permissions', permission: true },
     { href: '/admin/settings', label: 'Settings', icon: Settings, tooltip: 'Application Settings', permission: true },
  ];

  const isNavItemVisible = (permission: PermissionKey | boolean) => {
    if (permission === true) return true;
    if (!currentUser) return false;
    
    // Check the specific permission string for all roles.
    if (typeof permission === 'string') {
        return currentUser[permission] === true;
    }
    
    return false;
  };
  
  const isActive = (href: string) => {
    if (href === '/admin/super-settings') {
      return pathname.startsWith(href);
    }
    return href === '/admin' ? pathname === href : pathname.startsWith(href) && href !== '/admin';
  }

  return (
    <>
      <ShadSidebarHeader className="border-b border-sidebar-border p-4">
        <Logo size="md" iconColorClass="text-sidebar-foreground" textColorClass="text-sidebar-foreground" />
      </ShadSidebarHeader>
      <ShadSidebarContent className="p-4 flex flex-col justify-between">
        <SidebarMenu>
          {navItems.filter(item => isNavItemVisible(item.permission as PermissionKey)).map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={isActive(item.href)}
                  tooltip={{children: item.tooltip, side: 'right', className: "bg-popover text-popover-foreground"}}
                  className={cn(
                    "w-full justify-start",
                    isActive(item.href)
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

        <div className="mt-auto">
            <SidebarSeparator />
             <SidebarMenu className="pt-2">
                {bottomNavItems.filter(item => isNavItemVisible(item.permission as PermissionKey)).map((item) => (
                    <SidebarMenuItem key={item.label}>
                    <Link href={item.href} passHref legacyBehavior>
                        <SidebarMenuButton
                        isActive={isActive(item.href)}
                        tooltip={{children: item.tooltip, side: 'right', className: "bg-popover text-popover-foreground"}}
                        className={cn(
                            "w-full justify-start",
                             isActive(item.href)
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
        </div>
      </ShadSidebarContent>

      <ShadSidebarFooter className="p-4 border-t border-sidebar-border">
        {currentUser?.canScanId && (
            <Link href="/scan" passHref legacyBehavior>
                <Button variant="outline" className="w-full bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 group-data-[collapsible=icon]:px-2">
                    <QrCode className="h-5 w-5 mr-0 md:mr-2 group-data-[collapsible=icon]:mr-0 shrink-0"/>
                    <span className="truncate group-data-[collapsible=icon]:hidden">Go to Scanner</span>
                </Button>
            </Link>
        )}
      </ShadSidebarFooter>
    </>
  );
}
