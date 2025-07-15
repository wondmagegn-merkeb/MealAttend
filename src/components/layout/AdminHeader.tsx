
"use client"; 

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, UserCircle, Settings as SettingsIcon, Edit3, PanelLeft } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar"; 
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth"; 
import { usePathname } from "next/navigation";
import { useSidebar } from "../ui/sidebar";

const getPageTitle = (pathname: string): string => {
  if (pathname === '/admin') return 'Dashboard';
  if (pathname.startsWith('/admin/attendance')) return 'Attendance';
  if (pathname.startsWith('/admin/students/new')) return 'Add New Student';
  if (pathname.startsWith('/admin/students/export')) return 'Export Students';
  if (pathname.startsWith('/admin/students/view-all-ids')) return 'View All ID Cards';
  if (pathname.includes('/edit')) {
      if (pathname.startsWith('/admin/students')) return 'Edit Student';
      if (pathname.startsWith('/admin/users')) return 'Edit User';
      if (pathname.startsWith('/admin/departments')) return 'Edit Department';
      if (pathname.startsWith('/admin/profile')) return 'Edit Profile';
  }
   if (pathname.includes('/id-card')) {
      if (pathname.startsWith('/admin/students')) return 'Student ID Card';
  }
  if (pathname.startsWith('/admin/students')) return 'Students';
  if (pathname.startsWith('/admin/users/new')) return 'Add New User';
  if (pathname.startsWith('/admin/users')) return 'Users';
  if (pathname.startsWith('/admin/departments/new')) return 'Add New Department';
  if (pathname.startsWith('/admin/departments')) return 'Departments';
  if (pathname.startsWith('/admin/activity-log')) return 'Activity Log';
  if (pathname.startsWith('/admin/settings')) return 'Settings';
  if (pathname.startsWith('/scan')) return 'QR Code Scanner';
  
  return 'MealAttend';
};


export function AdminHeader() {
  const { logout, currentUser } = useAuth(); 
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  const userFullName = currentUser?.fullName || "User";
  const userEmail = currentUser?.email || "user@example.com";
  const userAvatar = currentUser?.profileImageURL;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/95 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
           <SidebarTrigger />
        </div>
        <div className="hidden md:block">
           <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
        </div>
      </div>
      
       <div className="flex-1 flex justify-center md:hidden">
          <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
       </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userAvatar || "https://placehold.co/100x100.png?text=U"} alt="User avatar" data-ai-hint="user avatar" />
                <AvatarFallback>
                  {userFullName.split(' ').map(n => n[0]).join('') || <UserCircle className="h-6 w-6 text-muted-foreground" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userFullName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
             <Link href="/admin/profile/edit" passHref legacyBehavior>
              <DropdownMenuItem asChild>
                <a> 
                  <Edit3 className="mr-2 h-4 w-4" />
                  <span>Edit Profile</span>
                </a>
              </DropdownMenuItem>
            </Link>
            <Link href="/admin/settings" passHref legacyBehavior>
              <DropdownMenuItem asChild>
                <a> 
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </a>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}> 
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
