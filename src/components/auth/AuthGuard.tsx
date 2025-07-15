
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import type { User } from '@/types/user';
import { toast } from '@/hooks/use-toast';

const PUBLIC_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password'];
const AUTH_FLOW_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password', '/auth/change-password'];


interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: User['role'];
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { 
    isAuthenticated, 
    currentUserRole, 
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

    if (isAuthenticated) {
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

      // If the page requires a specific role and the user doesn't have it, deny access.
      if (requiredRole && currentUserRole !== requiredRole) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to view this page.",
          variant: "destructive"
        });
        router.replace('/admin');
        return;
      }
    }
  }, [isAuthenticated, isPasswordChangeRequired, currentUserRole, pathname, router, requiredRole]);

  // Show a loading screen while auth state is being determined or a redirect is imminent.
  const isLoading = isAuthenticated === null || 
                   (!isAuthenticated && !AUTH_FLOW_PATHS.includes(pathname)) ||
                   (isAuthenticated && isPasswordChangeRequired && pathname !== '/auth/change-password') ||
                   (isAuthenticated && requiredRole && currentUserRole !== requiredRole);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  // If all checks pass, render the children.
  return <>{children}</>;
}
