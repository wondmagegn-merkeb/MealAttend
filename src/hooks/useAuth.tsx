
"use client";

import type { Dispatch, SetStateAction, ReactNode} from 'react';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_TOKEN_KEY, CURRENT_USER_DETAILS_KEY } from '@/lib/constants';
import { useToast } from './use-toast';
import { logUserActivity } from '@/lib/activityLogger';
import type { ProfileEditFormData } from '@/components/admin/users/UserForm';
import type { UserWithDepartment, User } from '@/types';
import type { SiteSettings } from '@prisma/client';

interface AuthContextType {
  isAuthenticated: boolean | null;
  currentUser: UserWithDepartment | null;
  currentUserRole: User['role'] | null;
  currentUserId: string | null; // ADERA User ID
  isPasswordChangeRequired: boolean;
  siteName: string;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<UserWithDepartment>;
  updateProfile: (profileData: ProfileEditFormData) => Promise<UserWithDepartment>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<UserWithDepartment | null>(null);
  const [isPasswordChangeRequired, setIsPasswordChangeRequired] = useState<boolean>(false);
  const [siteName, setSiteName] = useState('MealAttend');
  const router = useRouter();
  const { toast } = useToast();

  const currentUserRole = currentUser?.role || null;
  const currentUserId = currentUser?.userId || null;

  const updateClientAuth = useCallback((user: UserWithDepartment | null) => {
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
        const storedUser: UserWithDepartment = JSON.parse(storedUserDetailsRaw);
        updateClientAuth(storedUser);
      } else {
        updateClientAuth(null);
      }

      fetch('/api/settings/site-management')
        .then(res => res.json())
        .then((settings: SiteSettings) => {
          if (settings.siteName) {
            setSiteName(settings.siteName);
            document.title = settings.siteName;
          }
        });

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
      
      const user: UserWithDepartment = data.user;
      
      updateClientAuth(user);
      
      logUserActivity(user.userId, "LOGIN_SUCCESS");
      toast({ title: "Login Successful", description: `Welcome back, ${user.fullName}!` });
      
      if (user.passwordChangeRequired) {
        router.push('/auth/change-password');
      } else {
        router.push('/admin');
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
        updateClientAuth(updatedUser);
        logUserActivity(currentUser.userId, "PASSWORD_CHANGE_SUCCESS");
        return updatedUser;
    } catch (error: any) {
        toast({ title: "Password Change Failed", description: error.message, variant: "destructive" });
        throw error;
    }
  }, [currentUser, toast, updateClientAuth]);

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
        updateClientAuth(updatedUser);
        logUserActivity(currentUser.userId, "PROFILE_UPDATE_SUCCESS");
        return updatedUser;
    } catch (error: any) {
        toast({ title: "Profile Update Failed", description: error.message, variant: "destructive" });
        throw error;
    }
  }, [currentUser, toast, updateClientAuth]);
  
  const value = {
    isAuthenticated,
    currentUser,
    currentUserRole,
    currentUserId,
    isPasswordChangeRequired,
    siteName,
    login,
    logout,
    changePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
