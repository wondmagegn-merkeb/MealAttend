
"use client";

import type { Dispatch, SetStateAction} from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AUTH_TOKEN_KEY, CURRENT_USER_DETAILS_KEY } from '@/lib/constants';
import { useToast } from './use-toast';
import type { User, Department } from '@prisma/client';
import { logUserActivity } from '@/lib/activityLogger';

export interface UserWithDepartment extends User {
  department: Department | null;
}

interface AuthContextType {
  isAuthenticated: boolean | null;
  currentUser: UserWithDepartment | null;
  currentUserRole: User['role'] | null;
  currentUserId: string | null; // ADERA User ID
  isPasswordChangeRequired: boolean;
  login: (userIdInput: string, password?: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<boolean>;
  setIsAuthenticated: Dispatch<SetStateAction<boolean | null>>;
  updateAuthContextUser: (updatedUser: UserWithDepartment) => void;
}

export function useAuth(): AuthContextType {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<UserWithDepartment | null>(null);
  const [isPasswordChangeRequired, setIsPasswordChangeRequired] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const currentUserRole = currentUser?.role || null;
  const currentUserId = currentUser?.userId || null;

  useEffect(() => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUserDetailsRaw = localStorage.getItem(CURRENT_USER_DETAILS_KEY);
      
      if (token && storedUserDetailsRaw) {
        const storedUser: UserWithDepartment = JSON.parse(storedUserDetailsRaw);
        setIsAuthenticated(true);
        setCurrentUser(storedUser);
        setIsPasswordChangeRequired(storedUser.passwordChangeRequired);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsPasswordChangeRequired(false);
      }
    } catch (e) {
      console.error("localStorage access error:", e);
      setIsAuthenticated(false);
      setCurrentUser(null);
      setIsPasswordChangeRequired(false);
    }
  }, []);

  const login = useCallback(async (userIdInput: string, password?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdInput, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        logUserActivity(userIdInput, "LOGIN_FAILURE", data.message || 'Invalid credentials');
        toast({ title: "Login Failed", description: data.message || "Invalid User ID or password.", variant: "destructive" });
        return false;
      }

      const user: UserWithDepartment = data.user;
      localStorage.setItem(AUTH_TOKEN_KEY, `mock-jwt-for-${user.userId}`);
      localStorage.setItem(CURRENT_USER_DETAILS_KEY, JSON.stringify(user));
      
      setIsAuthenticated(true);
      setCurrentUser(user);
      setIsPasswordChangeRequired(user.passwordChangeRequired);
      
      logUserActivity(user.userId, "LOGIN_SUCCESS");
      toast({ title: "Login Successful", description: `Welcome back, ${user.fullName}!` });
      
      if (user.passwordChangeRequired) {
        router.push('/auth/change-password');
      } else {
        router.push('/admin');
      }
      return true;

    } catch (error) {
      console.error("Login API error:", error);
      logUserActivity(userIdInput, "LOGIN_ERROR", (error as Error).message);
      toast({ title: "Login Error", description: "An unexpected error occurred.", variant: "destructive" });
      return false;
    }
  }, [toast, router]); 

  const logout = useCallback(() => {
    const loggingOutUserId = currentUser?.userId || null;
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_DETAILS_KEY);

      setIsAuthenticated(false);
      setCurrentUser(null);
      setIsPasswordChangeRequired(false); 
      
      if (loggingOutUserId) {
        logUserActivity(loggingOutUserId, "LOGOUT_SUCCESS");
      }
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/auth/login');
    } catch (e) {
        console.error("Logout error:", e);
    }
  }, [router, toast, currentUser]);

  const changePassword = useCallback(async (newPassword: string): Promise<boolean> => {
    if (!currentUser) {
      toast({ title: "Error", description: "No active user session found.", variant: "destructive" });
      return false;
    }

    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword, passwordChangeRequired: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update password.');
      }
      
      const updatedUser = await response.json();
      setCurrentUser(updatedUser);
      localStorage.setItem(CURRENT_USER_DETAILS_KEY, JSON.stringify(updatedUser));
      setIsPasswordChangeRequired(false);
      logUserActivity(currentUser.userId, "PASSWORD_CHANGE_API_SUCCESS");
      return true;

    } catch (e) {
      const error = e as Error;
      console.error("Error changing password:", error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
      logUserActivity(currentUser.userId, "PASSWORD_CHANGE_FAILURE", error.message);
      return false;
    }
  }, [currentUser, toast]);

  const updateAuthContextUser = useCallback((updatedUser: UserWithDepartment) => {
    setCurrentUser(updatedUser);
    localStorage.setItem(CURRENT_USER_DETAILS_KEY, JSON.stringify(updatedUser));
    // This function is for context updates after an API call, e.g., profile edit.
    // The API call itself is handled in the component.
  }, []);

  return { 
    isAuthenticated, 
    currentUser,
    currentUserRole, 
    currentUserId, 
    isPasswordChangeRequired, 
    login, 
    logout, 
    changePassword, 
    setIsAuthenticated,
    updateAuthContextUser
  };
}
