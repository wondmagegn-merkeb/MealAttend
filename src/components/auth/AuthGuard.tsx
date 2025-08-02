
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import type { PermissionKey } from '@/types/permissions';
import { toast } from '@/hooks/use-toast';
import { Logo } from '../shared/Logo';

const PUBLIC_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password'];
const AUTH_FLOW_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password', '/auth/change-password'];


interface AuthGuardProps {
  children: ReactNode;
  permission?: PermissionKey;
  requiredRole?: 'Super Admin' | 'Admin' | 'User';
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

    const isAuthFlowPage = AUTH_FLOW_PATHS.includes(pathname);

    // If not authenticated and not on a public auth flow page, redirect to login.
    if (!isAuthenticated && !isAuthFlowPage) {
      router.replace('/auth/login');
      return;
    }

    if (isAuthenticated && currentUser) {
      // If password change is required, force user to the change password page.
      if (isPasswordChangeRequired && pathname !== '/auth/change-password') {
        router.replace('/auth/change-password');
        return;
      }
      
      // If on an auth flow page but password change is NOT required, redirect to dashboard.
      if (!isPasswordChangeRequired && isAuthFlowPage) {
        router.replace('/admin');
        return;
      }
      
      // If a specific role is required and the user doesn't have it, deny access.
      if (requiredRole && currentUser.role !== requiredRole) {
        toast({
          title: "Access Denied",
          description: `You must be a ${requiredRole} to view this page.`,
          variant: "destructive"
        });
        router.replace('/admin');
        return;
      }

      // If the page requires a specific permission and the user doesn't have it, deny access.
      // This now applies to ALL users, including Super Admins.
      if (permission && !currentUser[permission]) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to view this page.",
          variant: "destructive"
        });
        router.replace('/admin');
        return;
      }
    }
  }, [isAuthenticated, isPasswordChangeRequired, currentUser, pathname, router, permission, requiredRole]);

  // Determine if content is ready to be shown
  let isReady = false;
  if (isAuthenticated && currentUser) {
      if (isPasswordChangeRequired && pathname === '/auth/change-password') {
          isReady = true;
      } else if (!isPasswordChangeRequired && !AUTH_FLOW_PATHS.includes(pathname)) {
          let hasRequiredRole = true;
          if (requiredRole) {
            hasRequiredRole = currentUser.role === requiredRole;
          }
          
          let hasRequiredPermission = true;
          if (permission) {
            hasRequiredPermission = !!currentUser[permission];
          }

          isReady = hasRequiredRole && hasRequiredPermission;
      }
  } else if (AUTH_FLOW_PATHS.includes(pathname)) {
      isReady = true;
  }
  
  if (isAuthenticated === null || !isReady) {
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
