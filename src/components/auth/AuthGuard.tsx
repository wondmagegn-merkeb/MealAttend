
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import type { User } from '@/types/user';

const PUBLIC_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password', '/auth/change-password'];

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

    if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname)) {
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


  // Initial loading state or if conditions for redirect are met but redirect hasn't completed
  if (isAuthenticated === null && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying access...</p>
      </div>
    );
  }
  
  if (isAuthenticated === true && isPasswordChangeRequired && pathname !== '/auth/change-password') {
    // Show loader while redirecting to change password
     return (
      <div className="flex flex-col justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting to update password...</p>
      </div>
    );
  }

  if (isAuthenticated === true && requiredRole && currentUserRole !== requiredRole && !PUBLIC_PATHS.includes(pathname) ) {
    // Show loader while redirecting due to role mismatch
     return (
      <div className="flex flex-col justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }


  // If authenticated (and password change not required or on the change page),
  // or on a public path, or role check passes, render children
  return <>{children}</>;
}

// Helper (could be in a different file or here for simplicity)
// This is a client-side toast function, ensure your ToastProvider is set up
import { toast } from '@/hooks/use-toast';
