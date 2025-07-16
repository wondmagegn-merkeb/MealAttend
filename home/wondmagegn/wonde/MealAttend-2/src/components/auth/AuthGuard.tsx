
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
const AUTH_FLOW_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password', '/auth/change-password'];


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
    // If auth state is still loading, do nothing yet.
    if (isAuthenticated === null) {
      return;
    }

    const isPublicPage = PUBLIC_PATHS.includes(pathname);
    const isAuthFlowPage = AUTH_FLOW_PATHS.includes(pathname);

    // If user is not authenticated...
    if (!isAuthenticated) {
      // and trying to access a protected page, redirect to login.
      if (!isPublicPage) {
        router.replace('/auth/login');
      }
      // Otherwise, it's a public page, so they can stay.
      return;
    }

    // If user IS authenticated...
    if (currentUser) {
      // and must change password, redirect to the change password page.
      if (isPasswordChangeRequired && pathname !== '/auth/change-password') {
        router.replace('/auth/change-password');
        return;
      }
      
      // and tries to access login/register pages when they don't need to change password, redirect to dashboard.
      if (!isPasswordChangeRequired && isAuthFlowPage && pathname !== '/auth/change-password') {
        router.replace('/admin');
        return;
      }
      
      // Role & Permission Checks for protected pages
      if (!isPublicPage) {
        const isSuperAdmin = currentUser.role === 'Super Admin';
        let hasAccess = true;

        if (requiredRole && currentUser.role !== requiredRole && !isSuperAdmin) {
            hasAccess = false;
        }

        if (permission && !isSuperAdmin && !currentUser[permission]) {
            hasAccess = false;
        }

        if (!hasAccess) {
             toast({
                title: "Access Denied",
                description: "You do not have permission to view this page.",
                variant: "destructive"
            });
            router.replace('/admin');
        }
      }
    }
  }, [isAuthenticated, isPasswordChangeRequired, currentUser, pathname, router, permission, requiredRole]);

  // Show a loading screen for protected pages while auth state is loading.
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

  // Render the page content if checks pass.
  return <>{children}</>;
}
