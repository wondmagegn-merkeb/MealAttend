
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

const MOCK_DEFAULT_PASSWORD = "password123";

// Define a fallback admin user to ensure login is always possible for demo
const MOCK_DEFAULT_ADMIN_USER: User = {
  id: 'usr_smp_001_fallback', // Use a distinct internal ID for fallback
  userId: 'ADERA/USR/2024/00001', // The ADERA ID used for login
  fullName: 'Alice Admin (Fallback)',
  department: 'Administration',
  email: 'alice.admin@example.com',
  role: 'Admin',
  profileImageURL: 'https://placehold.co/100x100.png?text=AA',
  createdAt: new Date('2023-01-10T10:00:00Z').toISOString(),
  updatedAt: new Date('2023-01-10T10:00:00Z').toISOString(),
};

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
          let usersToSearch: User[] = [];

          if (storedUsersRaw) {
            try {
              usersToSearch = JSON.parse(storedUsersRaw);
            } catch (parseError) {
              console.error("Failed to parse users from localStorage", parseError);
              usersToSearch = []; // Fallback to empty if parsing fails
            }
          }

          // Ensure the default admin is available for login, especially if localStorage is empty or corrupted
          const adminExistsInStorage = usersToSearch.some(u => u.userId === MOCK_DEFAULT_ADMIN_USER.userId);
          if (!adminExistsInStorage) {
            // Add the fallback admin if not found. This ensures the demo login always works.
            // For a real app, this fallback logic would not exist; users would come from a DB.
            usersToSearch.push(MOCK_DEFAULT_ADMIN_USER);
          }
          
          const user = usersToSearch.find(u => u.userId === userId);

          if (user && password === MOCK_DEFAULT_PASSWORD) {
            localStorage.setItem(AUTH_TOKEN_KEY, `mock-jwt-token-for-${user.userId}`);
            localStorage.setItem(CURRENT_USER_ROLE_KEY, user.role);
            localStorage.setItem(CURRENT_USER_ID_KEY, user.userId);

            setIsAuthenticated(true);
            setCurrentUserRole(user.role);
            setCurrentUserId(user.userId);

            const passwordChangeDismissedKey = PASSWORD_CHANGE_REQUIRED_KEY_PREFIX + user.userId + "_dismissed";
            const passwordChangeRequiredKey = PASSWORD_CHANGE_REQUIRED_KEY_PREFIX + user.userId;
            
            const passwordChangeDismissed = localStorage.getItem(passwordChangeDismissedKey);

            if (!passwordChangeDismissed) {
              localStorage.setItem(passwordChangeRequiredKey, 'true');
              setIsPasswordChangeRequired(true);
            } else {
              localStorage.removeItem(passwordChangeRequiredKey);
              setIsPasswordChangeRequired(false);
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
  }, [toast]); // Removed checkPasswordChangeStatus from here as it's called from useEffect

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_ROLE_KEY);
      // The password change flag (PASSWORD_CHANGE_REQUIRED_KEY_PREFIX + uid) and its "_dismissed" counterpart
      // are specific to a user and should ideally remain unless explicitly handled by password change logic.
      // For this simulation, we'll leave them as they are, as they are tied to the user's ID.
      localStorage.removeItem(CURRENT_USER_ID_KEY);


      setIsAuthenticated(false);
      setCurrentUserRole(null);
      setCurrentUserId(null);
      setIsPasswordChangeRequired(false); // Reset this on logout for safety
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/auth/login');
    } catch (e) {
      toast({ title: "Logout Error", description: "Could not clear session.", variant: "destructive" });
    }
  }, [router, toast]);

  const clearPasswordChangeRequirement = useCallback(() => {
    const uid = currentUserId;
    if (uid) {
      try {
        localStorage.setItem(PASSWORD_CHANGE_REQUIRED_KEY_PREFIX + uid + "_dismissed", 'true');
        localStorage.removeItem(PASSWORD_CHANGE_REQUIRED_KEY_PREFIX + uid);
        setIsPasswordChangeRequired(false);
      } catch (e) {
        console.error("Error clearing password change requirement flag:", e);
      }
    }
  }, [currentUserId]);

  return { isAuthenticated, currentUserRole, currentUserId, isPasswordChangeRequired, login, logout, clearPasswordChangeRequirement, setIsAuthenticated };
}
