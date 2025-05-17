
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
import { LogOut, UserCircle, Settings as SettingsIcon, Edit3 } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { SidebarTrigger } from "@/components/ui/sidebar"; 
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth"; 

export function AdminHeader() {
  const { logout, currentUser } = useAuth(); 

  const userFullName = currentUser?.fullName || "User";
  const userEmail = currentUser?.email || "user@example.com";
  const userAvatar = currentUser?.profileImageURL;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
           <SidebarTrigger />
        </div>
        <div className="hidden md:block">
          <Logo size="md" iconColorClass="text-primary" textColorClass="text-primary" />
        </div>
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
