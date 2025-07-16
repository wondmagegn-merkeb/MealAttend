
"use client";

import type { Dispatch, SetStateAction} from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AUTH_TOKEN_KEY, CURRENT_USER_DETAILS_KEY } from '@/lib/constants';
import { useToast } from './use-toast';
import { logUserActivity } from '@/lib/activityLogger';
import type { ProfileEditFormData } from '@/components/admin/users/UserForm';
import type { UserWithDepartment, User } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean | null;
  currentUser: UserWithDepartment | null;
  currentUserRole: User['role'] | null;
  currentUserId: string | null; // ADERA User ID
  isPasswordChangeRequired: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<UserWithDepartment>;
  updateProfile: (profileData: ProfileEditFormData) => Promise<UserWithDepartment>;
  setIsAuthenticated: Dispatch<SetStateAction<boolean | null>>;
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

  const login = useCallback(async (email: string, password?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      console.log("Login response:", response);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
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
      } else if (user.role === 'Admin') {
        router.push('/admin');
      } else {
        router.push('/admin/students'); // Default page for 'User' role
      }
      return true;
    } catch (error: any) {
      logUserActivity(email, "LOGIN_FAILURE", error.message);
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
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

  const changePassword = useCallback(async (newPassword: string): Promise<UserWithDepartment> => {
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
        
        const updatedUser: UserWithDepartment = data.user;
        setCurrentUser(updatedUser);
        localStorage.setItem(CURRENT_USER_DETAILS_KEY, JSON.stringify(updatedUser));
        setIsPasswordChangeRequired(false);
        logUserActivity(currentUser.userId, "PASSWORD_CHANGE_SUCCESS");
        return updatedUser;
    } catch (error: any) {
        toast({ title: "Password Change Failed", description: error.message, variant: "destructive" });
        throw error;
    }
  }, [currentUser, toast]);

  const updateProfile = useCallback(async (profileData: ProfileEditFormData): Promise<UserWithDepartment> => {
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
                profileImageURL: profileData.profileImageURL || null,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile.');
        }
        
        const updatedUser: UserWithDepartment = data.user;
        // Update state and local storage for immediate UI feedback
        setCurrentUser(updatedUser);
        localStorage.setItem(CURRENT_USER_DETAILS_KEY, JSON.stringify(updatedUser));
        logUserActivity(currentUser.userId, "PROFILE_UPDATE_SUCCESS");
        return updatedUser;
    } catch (error: any) {
        toast({ title: "Profile Update Failed", description: error.message, variant: "destructive" });
        throw error;
    }
  }, [currentUser, toast]);

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

    