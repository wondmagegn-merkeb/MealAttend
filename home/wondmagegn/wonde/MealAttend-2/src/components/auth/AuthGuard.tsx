
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import type { PermissionKey, User } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Logo } from '../shared/Logo';

const PUBLIC_PATHS = ['/', '/auth/login', '/auth/forgot-password', '/auth/reset-password'];
const AUTH_FLOW_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password'];


interface AuthGuardProps {
  children: ReactNode;
  permission?: PermissionKey;
  requiredRole?: User['role'];
}

export function AuthGuard({ children, permission, requiredRole }: AuthGuardProps) {
  const { 
    isAuthenticated, 
    currentUser,
    isPasswordChangeRequired 
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until the auth state is determined.
    if (isAuthenticated === null) {
      return;
    }

    const isPublicPage = PUBLIC_PATHS.includes(pathname);

    // If page is public, allow access immediately.
    if (isPublicPage) {
      // But if user is already logged in and tries to access login/forgot password, redirect them.
      if (isAuthenticated && AUTH_FLOW_PATHS.includes(pathname)) {
        router.replace('/admin');
      }
      return;
    }
    
    // From here, we are on a protected page.

    // If not authenticated, redirect to login.
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    // From here, user is authenticated.
    if (currentUser) {
      // If password change is required, force user to the change password page.
      if (isPasswordChangeRequired && pathname !== '/auth/change-password') {
        router.replace('/auth/change-password');
        return;
      }
      
      // Don't let users who have changed their password go back to the change password page.
      if (!isPasswordChangeRequired && pathname === '/auth/change-password') {
          router.replace('/admin');
          return;
      }
      
      const isSuperAdmin = currentUser.role === 'Super Admin';

      // Role-based access check
      if (requiredRole && currentUser.role !== requiredRole && !isSuperAdmin) {
         toast({
          title: "Access Denied",
          description: "You do not have the required role to view this page.",
          variant: "destructive"
        });
        router.replace('/admin');
        return;
      }

      // Permission-based access check
      if (permission && !isSuperAdmin && !currentUser[permission]) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to perform this action or view this page.",
          variant: "destructive"
        });
        router.replace('/admin');
        return;
      }
    }
  }, [isAuthenticated, isPasswordChangeRequired, currentUser, pathname, router, permission, requiredRole]);

  // Loading state while checking authentication for protected pages
  if (isAuthenticated === null && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background">
        <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div className="flex flex-col items-center">
                <Logo size="lg" textColorClass="text-primary" />
                <p className="text-muted-foreground mt-2">Verifying access...</p>
            </div>
        </div>
      </div>
    );
  }

  // If all checks pass, render the children.
  return <>{children}</>;
}
