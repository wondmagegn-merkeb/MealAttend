
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
    setIsAuthenticated, 
    currentUserId, 
    currentUserRole, 
    isPasswordChangeRequired 
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthenticated === null) {
      // Still determining auth state, do nothing until it's resolved by useAuth's own useEffect
      return;
    }

    if (!isAuthenticated && !AUTH_FLOW_PATHS.includes(pathname)) {
      router.replace('/auth/login');
      return;
    }

    if (isAuthenticated) {
      if (isPasswordChangeRequired && pathname !== '/auth/change-password') {
        router.replace('/auth/change-password');
        return;
      }

      if (!isPasswordChangeRequired && pathname === '/auth/change-password') {
        // If somehow user lands on change-password but doesn't need to, redirect
        router.replace('/admin');
        return;
      }
      
      if (PUBLIC_PATHS.includes(pathname)) {
        // If logged in and on a public-only page like login, redirect to dashboard
        router.replace('/admin');
        return;
      }

      if (requiredRole && currentUserRole !== requiredRole) {
        // User is authenticated but doesn't have the required role
        toast({
          title: "Access Denied",
          description: "You do not have permission to view this page.",
          variant: "destructive"
        });
        router.replace('/admin'); // Or a dedicated access-denied page
        return;
      }
    }
  }, [isAuthenticated, pathname, router, setIsAuthenticated, requiredRole, currentUserRole, currentUserId, isPasswordChangeRequired]);


  // Show a full-screen loader while authentication state is being determined.
  if (isAuthenticated === null && !AUTH_FLOW_PATHS.includes(pathname)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying access...</p>
      </div>
    );
  }
  
  // Show a loader while redirecting for password change.
  if (isAuthenticated === true && isPasswordChangeRequired && pathname !== '/auth/change-password') {
     return (
      <div className="flex flex-col justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting to update password...</p>
      </div>
    );
  }

  // Show a loader while redirecting due to role mismatch.
  if (isAuthenticated === true && requiredRole && currentUserRole !== requiredRole && !AUTH_FLOW_PATHS.includes(pathname) ) {
     return (
      <div className="flex flex-col justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }

  // If authenticated (and password change not required or on the change page),
  // or on a public path, or role check passes, render children.
  return <>{children}</>;
}
