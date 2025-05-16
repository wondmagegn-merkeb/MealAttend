
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

interface AuthGuardProps {
  children: ReactNode;
}

const PUBLIC_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password'];

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, setIsAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This effect runs on the client after initial mount and when isAuthenticated or pathname changes.
    // It ensures the auth state is correctly synchronized with localStorage and redirects if necessary.
    let currentToken = null;
    try {
        currentToken = localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (e) {
        console.error("AuthGuard: localStorage access error", e);
    }
    
    const isTokenValid = !!currentToken;

    if (isAuthenticated === null) { // Initial state, determine from token
        setIsAuthenticated(isTokenValid);
        if (!isTokenValid && !PUBLIC_PATHS.includes(pathname)) {
            router.replace('/auth/login');
        }
        return;
    }

    if (isAuthenticated !== isTokenValid) { // State mismatch with token (e.g. token removed externally)
        setIsAuthenticated(isTokenValid);
    }
    
    if (!isTokenValid && !PUBLIC_PATHS.includes(pathname)) {
      router.replace('/auth/login');
    }

  }, [isAuthenticated, pathname, router, setIsAuthenticated]);

  if (isAuthenticated === null && !PUBLIC_PATHS.includes(pathname)) {
    // Show loader if auth state is still being determined and not on a public path
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname)) {
    // This case handles rendering while the redirect is in progress or if auth state is definitively false
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  // If authenticated, or on a public path, render children
  return <>{children}</>;
}

    