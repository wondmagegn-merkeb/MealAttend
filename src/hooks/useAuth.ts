
"use client";

import type { Dispatch, SetStateAction} from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AUTH_TOKEN_KEY, CURRENT_USER_DETAILS_KEY } from '@/lib/constants';
import { useToast } from './use-toast';
import { logUserActivity } from '@/lib/activityLogger';
import type { UserFormData, ProfileEditFormData } from '@/components/admin/users/UserForm';
import { mockUsers } from '@/lib/demo-data';
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    // For demo purposes, any password is valid for a found user, but 'password' is required for the user who needs to change it.
    if (user && (user.passwordChangeRequired ? password === 'password' : true)) {
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
    } else {
      const message = "Invalid email or password.";
      logUserActivity(email, "LOGIN_FAILURE", message);
      toast({ title: "Login Failed", description: message, variant: "destructive" });
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

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedUser = { ...currentUser, passwordChangeRequired: false };
    setCurrentUser(updatedUser);
    localStorage.setItem(CURRENT_USER_DETAILS_KEY, JSON.stringify(updatedUser));
    setIsPasswordChangeRequired(false);
    logUserActivity(currentUser.userId, "PASSWORD_CHANGE_SUCCESS_DEMO");
    return updatedUser;
  }, [currentUser]);

  const updateProfile = useCallback(async (profileData: ProfileEditFormData): Promise<UserWithDepartment> => {
    if (!currentUser) {
        throw new Error("No active user session found.");
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const updatedUser = { 
        ...currentUser, 
        fullName: profileData.fullName,
        email: profileData.email,
        profileImageURL: profileData.profileImageURL || null,
    };
    
    setCurrentUser(updatedUser);
    localStorage.setItem(CURRENT_USER_DETAILS_KEY, JSON.stringify(updatedUser));
    logUserActivity(currentUser.userId, "PROFILE_UPDATE_SUCCESS_DEMO");
    return updatedUser;
  }, [currentUser]);

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
