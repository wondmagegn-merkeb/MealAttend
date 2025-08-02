
"use client";

import type { Dispatch, SetStateAction} from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AUTH_TOKEN_KEY, CURRENT_USER_DETAILS_KEY } from '@/lib/constants';
import { useToast } from './use-toast';
import { logUserActivity } from '@/lib/activityLogger';
import type { ProfileEditFormData } from '@/components/admin/users/UserForm';
import type { UserWithCreator, User } from '@/types';
import { getRedirectPathForUser } from '@/lib/redirects';

interface AuthContextType {
  isAuthenticated: boolean | null;
  currentUser: UserWithCreator | null;
  currentUserRole: User['role'] | null;
  currentUserId: string | null; // ADERA User ID
  isPasswordChangeRequired: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<UserWithCreator>;
  updateProfile: (profileData: ProfileEditFormData) => Promise<UserWithCreator>;
  setIsAuthenticated: Dispatch<SetStateAction<boolean | null>>;
}

export function useAuth(): AuthContextType {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<UserWithCreator | null>(null);
  const [isPasswordChangeRequired, setIsPasswordChangeRequired] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const currentUserRole = currentUser?.role || null;
  const currentUserId = currentUser?.userId || null;

  const updateClientAuth = useCallback((user: UserWithCreator | null) => {
    if (user) {
        localStorage.setItem(AUTH_TOKEN_KEY, `mock-jwt-for-${user.userId}`);
        localStorage.setItem(CURRENT_USER_DETAILS_KEY, JSON.stringify(user));
        setIsAuthenticated(true);
        setCurrentUser(user);
        setIsPasswordChangeRequired(user.passwordChangeRequired);
    } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(CURRENT_USER_DETAILS_KEY);
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsPasswordChangeRequired(false);
    }
  }, []);

  useEffect(() => {
    try {
      const storedUserDetailsRaw = localStorage.getItem(CURRENT_USER_DETAILS_KEY);
      if (storedUserDetailsRaw) {
        const storedUser: UserWithCreator = JSON.parse(storedUserDetailsRaw);
        updateClientAuth(storedUser);
      } else {
        updateClientAuth(null);
      }
    } catch (e) {
      console.error("localStorage access error:", e);
      updateClientAuth(null);
    }
  }, [updateClientAuth]);

  const login = useCallback(async (email: string, password?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }
      
      const user: UserWithCreator = data.user;
      
      updateClientAuth(user);
      
      logUserActivity(user.userId, "LOGIN_SUCCESS");
      toast({ title: "Login Successful", description: `Welcome back, ${user.fullName}!` });
      
      if (user.passwordChangeRequired) {
        router.push('/auth/change-password');
      } else {
        // Intelligent redirect based on permissions
        const redirectPath = getRedirectPathForUser(user);
        router.push(redirectPath);
      }
      return true;
    } catch (error: any) {
      logUserActivity(email, "LOGIN_FAILURE", error.message);
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
      return false;
    }
  }, [toast, router, updateClientAuth]); 

  const logout = useCallback(() => {
    const loggingOutUserId = currentUser?.userId || null;
    try {
      updateClientAuth(null);
      
      if (loggingOutUserId) {
        logUserActivity(loggingOutUserId, "LOGOUT_SUCCESS");
      }
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/auth/login');
    } catch (e) {
        console.error("Logout error:", e);
    }
  }, [router, toast, currentUser, updateClientAuth]);

  const changePassword = useCallback(async (newPassword: string): Promise<UserWithCreator> => {
    if (!currentUser) {
      throw new Error("No active user session found.");
    }
    
    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.userId, newPassword }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to change password.');
        }
        
        const updatedUser: UserWithCreator = data.user;
        updateClientAuth(updatedUser);
        logUserActivity(currentUser.userId, "PASSWORD_CHANGE_SUCCESS");
        return updatedUser;
    } catch (error: any) {
        toast({ title: "Password Change Failed", description: error.message, variant: "destructive" });
        throw error;
    }
  }, [currentUser, toast, updateClientAuth]);

  const updateProfile = useCallback(async (profileData: ProfileEditFormData): Promise<UserWithCreator> => {
    if (!currentUser) {
        throw new Error("No active user session found.");
    }
    
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.userId,
                fullName: profileData.fullName,
                profileImageURL: profileData.profileImageURL, // Pass the full profileData object
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile.');
        }
        
        const updatedUser: UserWithCreator = data.user;
        updateClientAuth(updatedUser);
        logUserActivity(currentUser.userId, "PROFILE_UPDATE_SUCCESS");
        return updatedUser;
    } catch (error: any) {
        toast({ title: "Profile Update Failed", description: error.message, variant: "destructive" });
        throw error;
    }
  }, [currentUser, toast, updateClientAuth]);

  return { 
    isAuthenticated, 
    currentUser,
    currentUserRole, 
    currentUserId, 
    isPasswordChangeRequired, 
    login, 
    logout, 
    changePassword, 
    updateProfile,
    setIsAuthenticated,
  };
}
