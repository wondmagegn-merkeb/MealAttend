
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
import { LogOut, UserCircle, Settings as SettingsIcon, Edit3, PanelLeft, LayoutDashboard, BookCopy, UsersRound, Users, Building2, History, UserPlus, FileDown, CreditCard, UserCog, ScanLine, ShieldCheck, ShieldAlert } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar"; 
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth"; 
import { usePathname } from "next/navigation";
import { useSidebar } from "../ui/sidebar";
import { useAppSettings } from "@/hooks/useAppSettings";

const getPageConfig = (pathname: string): { title: string, icon: React.ReactNode | null } => {
  // Main Navigation
  if (pathname === '/admin') return { title: 'Dashboard', icon: <LayoutDashboard className="h-6 w-6" /> };
  if (pathname.startsWith('/admin/attendance')) return { title: 'Attendance', icon: <BookCopy className="h-6 w-6" /> };
  if (pathname.startsWith('/admin/settings')) return { title: 'Settings', icon: <SettingsIcon className="h-6 w-6" /> };
  if (pathname.startsWith('/admin/super-settings')) return { title: 'Super Admin Settings', icon: <ShieldAlert className="h-6 w-6" /> };
  if (pathname.startsWith('/admin/students')) {
    if (pathname.startsWith('/admin/students/new')) return { title: 'Add New Student', icon: <UserPlus className="h-6 w-6" /> };
    if (pathname.startsWith('/admin/students/export')) return { title: 'Export Students', icon: <FileDown className="h-6 w-6" /> };
    if (pathname.startsWith('/admin/students/view-all-ids')) return { title: 'View All ID Cards', icon: <CreditCard className="h-6 w-6" /> };
    if (pathname.includes('/edit')) return { title: 'Edit Student', icon: <Edit3 className="h-6 w-6" /> };
    if (pathname.includes('/id-card')) return { title: 'Student ID Card', icon: <CreditCard className="h-6 w-6" /> };
    return { title: 'Students', icon: <UsersRound className="h-6 w-6" /> };
  }
   if (pathname.startsWith('/admin/users')) {
    if (pathname.startsWith('/admin/users/new')) return { title: 'Add New User', icon: <UserPlus className="h-6 w-6" /> };
    if (pathname.includes('/edit')) return { title: 'Edit User', icon: <Edit3 className="h-6 w-6" /> };
    return { title: 'Users', icon: <Users className="h-6 w-6" /> };
  }
  if (pathname.startsWith('/admin/departments')) {
    if (pathname.startsWith('/admin/departments/new')) return { title: 'Add New Department', icon: <Building2 className="h-6 w-6" /> };
    if (pathname.includes('/edit')) return { title: 'Edit Department', icon: <Edit3 className="h-6 w-6" /> };
    return { title: 'Departments', icon: <Building2 className="h-6 w-6" /> };
  }
  if (pathname.startsWith('/admin/activity-log')) return { title: 'Activity Log', icon: <History className="h-6 w-6" /> };
  if (pathname.startsWith('/admin/profile/edit')) return { title: 'Edit Profile', icon: <UserCog className="h-6 w-6" /> };
  if (pathname.startsWith('/admin/profile/my-permissions')) return { title: 'My Permissions', icon: <ShieldCheck className="h-6 w-6" /> };
  if (pathname.startsWith('/scan')) return { title: 'QR Code Scanner', icon: <ScanLine className="h-6 w-6" /> };
  
  return { title: 'MealAttend', icon: null };
};


export function AdminHeader() {
  const { logout, currentUser } = useAuth(); 
  const { settings } = useAppSettings();
  const pathname = usePathname();
  const { title, icon } = getPageConfig(pathname);

  const userFullName = currentUser?.fullName || "User";
  const userEmail = currentUser?.email || "user@example.com";
  const userAvatar = currentUser?.profileImageURL;

  const PageTitle = () => (
    <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
      {icon} {title}
    </h1>
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/95 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
           <SidebarTrigger />
        </div>
        <div className="hidden md:block">
           <PageTitle />
        </div>
      </div>
      
       <div className="flex-1 flex justify-center md:hidden">
          <PageTitle />
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
             <Link href="/admin/profile/my-permissions" passHref legacyBehavior>
              <DropdownMenuItem asChild>
                <a> 
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>My Permissions</span>
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
