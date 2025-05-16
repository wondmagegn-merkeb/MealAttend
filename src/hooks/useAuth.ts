
"use client";

import type { Dispatch, SetStateAction} from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_TOKEN_KEY } from '@/lib/constants';
import { useToast } from './use-toast';

// MOCK USER FOR DEMO - In a real app, this would come from a backend
const MOCK_USER_EMAIL = "admin@example.com";
const MOCK_USER_PASSWORD = "password123";

interface AuthContextType {
  isAuthenticated: boolean | null;
  login: (email?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  setIsAuthenticated: Dispatch<SetStateAction<boolean | null>>;
}

export function useAuth(): AuthContextType {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check auth status on initial load
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      setIsAuthenticated(!!token);
    } catch (e) {
      console.error("localStorage access error:", e);
      setIsAuthenticated(false); // Fallback if localStorage is unavailable
    }
  }, []);

  const login = useCallback(async (email?: string, password?: string): Promise<boolean> => {
    // Simulate API call for login
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email === MOCK_USER_EMAIL && password === MOCK_USER_PASSWORD) {
          try {
            localStorage.setItem(AUTH_TOKEN_KEY, 'mock-jwt-token-for-mealattend');
            setIsAuthenticated(true);
            toast({ title: "Login Successful", description: "Welcome back!" });
            resolve(true);
          } catch (e) {
            toast({ title: "Login Error", description: "Could not save session.", variant: "destructive" });
            resolve(false);
          }
        } else {
          toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
          resolve(false);
        }
      }, 500);
    });
  }, [toast]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setIsAuthenticated(false);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/auth/login'); // Redirect to login after logout
    } catch (e) {
      toast({ title: "Logout Error", description: "Could not clear session.", variant: "destructive" });
    }
  }, [router, toast]);

  return { isAuthenticated, login, logout, setIsAuthenticated };
}

    