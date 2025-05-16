
"use client";

import type { Dispatch, SetStateAction} from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AUTH_TOKEN_KEY, 
  USERS_STORAGE_KEY, 
  CURRENT_USER_ROLE_KEY, 
  CURRENT_USER_ID_KEY,
  PASSWORD_CHANGE_REQUIRED_KEY_PREFIX 
} from '@/lib/constants';
import { useToast } from './use-toast';
import type { User } from '@/types/user';

// MOCK USER FOR DEMO
const MOCK_DEFAULT_PASSWORD = "password123"; // Used for all users for simplicity in demo

interface AuthContextType {
  isAuthenticated: boolean | null;
  currentUserRole: User['role'] | null;
  currentUserId: string | null;
  isPasswordChangeRequired: boolean;
  login: (userId?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  clearPasswordChangeRequirement: () => void;
  setIsAuthenticated: Dispatch<SetStateAction<boolean | null>>;
}

export function useAuth(): AuthContextType {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<User['role'] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPasswordChangeRequired, setIsPasswordChangeRequired] = useState<boolean>(false);
  const router = useRouter();
  const { toast } = useToast();

  const checkPasswordChangeStatus = useCallback((userIdToCheck: string | null) => {
    if (!userIdToCheck) {
      setIsPasswordChangeRequired(false);
      return;
    }
    try {
      const changeRequired = localStorage.getItem(PASSWORD_CHANGE_REQUIRED_KEY_PREFIX + userIdToCheck);
      setIsPasswordChangeRequired(changeRequired === 'true');
    } catch (e) {
      console.error("localStorage access error for password change status:", e);
      setIsPasswordChangeRequired(false);
    }
  }, []);

  useEffect(() => {
    // Check auth status on initial load
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedRole = localStorage.getItem(CURRENT_USER_ROLE_KEY) as User['role'] | null;
      const storedUserId = localStorage.getItem(CURRENT_USER_ID_KEY);
      
      setIsAuthenticated(!!token);
      setCurrentUserRole(storedRole);
      setCurrentUserId(storedUserId);
      if (token && storedUserId) {
        checkPasswordChangeStatus(storedUserId);
      }

    } catch (e) {
      console.error("localStorage access error:", e);
      setIsAuthenticated(false);
      setCurrentUserRole(null);
      setCurrentUserId(null);
      setIsPasswordChangeRequired(false);
    }
  }, [checkPasswordChangeStatus]);

  const login = useCallback(async (userId?: string, password?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
          const users: User[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
          const user = users.find(u => u.userId === userId);

          if (user && password === MOCK_DEFAULT_PASSWORD) {
            localStorage.setItem(AUTH_TOKEN_KEY, `mock-jwt-token-for-${userId}`);
            localStorage.setItem(CURRENT_USER_ROLE_KEY, user.role);
            localStorage.setItem(CURRENT_USER_ID_KEY, user.userId);
            
            setIsAuthenticated(true);
            setCurrentUserRole(user.role);
            setCurrentUserId(user.userId);

            // Simulate "first login" for specific user or if no password change dismissal is found
            const passwordChangeDismissed = localStorage.getItem(PASSWORD_CHANGE_REQUIRED_KEY_PREFIX + user.userId + "_dismissed");
            if (!passwordChangeDismissed) { // For any user logging in with default pass
                 localStorage.setItem(PASSWORD_CHANGE_REQUIRED_KEY_PREFIX + user.userId, 'true');
                 setIsPasswordChangeRequired(true);
            } else {
                 setIsPasswordChangeRequired(false); // Ensure it's false if dismissed
            }

            toast({ title: "Login Successful", description: `Welcome back, ${user.fullName}!` });
            resolve(true);
          } else {
            toast({ title: "Login Failed", description: "Invalid User ID or password.", variant: "destructive" });
            resolve(false);
          }
        } catch (e) {
          console.error("Login error:", e);
          toast({ title: "Login Error", description: "An unexpected error occurred.", variant: "destructive" });
          resolve(false);
        }
      }, 500);
    });
  }, [toast]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_ROLE_KEY);
      // Do not remove password change required flag on logout, only on successful change or explicit dismissal
      const uid = localStorage.getItem(CURRENT_USER_ID_KEY);
      if (uid) { // Keep password change required status for the user
          // localStorage.removeItem(PASSWORD_CHANGE_REQUIRED_KEY_PREFIX + uid);
      }
      localStorage.removeItem(CURRENT_USER_ID_KEY);


      setIsAuthenticated(false);
      setCurrentUserRole(null);
      setCurrentUserId(null);
      setIsPasswordChangeRequired(false);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/auth/login'); 
    } catch (e) {
      toast({ title: "Logout Error", description: "Could not clear session.", variant: "destructive" });
    }
  }, [router, toast]);

  const clearPasswordChangeRequirement = useCallback(() => {
    const uid = currentUserId; // Use state for currentUserId
    if (uid) {
      try {
        localStorage.setItem(PASSWORD_CHANGE_REQUIRED_KEY_PREFIX + uid + "_dismissed", 'true'); // Mark as dismissed
        localStorage.removeItem(PASSWORD_CHANGE_REQUIRED_KEY_PREFIX + uid); // Remove the "required" flag
        setIsPasswordChangeRequired(false);
      } catch (e) {
        console.error("Error clearing password change requirement flag:", e);
      }
    }
  }, [currentUserId]);

  return { isAuthenticated, currentUserRole, currentUserId, isPasswordChangeRequired, login, logout, clearPasswordChangeRequirement, setIsAuthenticated };
}
    
