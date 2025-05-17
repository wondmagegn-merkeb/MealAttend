
"use client";

import type { Dispatch, SetStateAction} from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AUTH_TOKEN_KEY,
  USERS_STORAGE_KEY,
  CURRENT_USER_ROLE_KEY,
  CURRENT_USER_ID_KEY,
  PASSWORD_CHANGE_REQUIRED_KEY_PREFIX,
  CURRENT_USER_DETAILS_KEY, // New key for full user details
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
  currentUser: User | null; // Changed to store full user object
  currentUserRole: User['role'] | null; // Kept for direct access if needed
  currentUserId: string | null; // Kept for direct access if needed
  isPasswordChangeRequired: boolean;
  login: (userIdInput?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  clearPasswordChangeRequirement: () => void;
  setIsAuthenticated: Dispatch<SetStateAction<boolean | null>>;
  updateCurrentUserDetails: (updatedDetails: Partial<User>) => void;
}

export function useAuth(): AuthContextType {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isPasswordChangeRequired, setIsPasswordChangeRequired] = useState<boolean>(false);
  const router = useRouter();
  const { toast } = useToast();

  const currentUserRole = currentUser?.role || null;
  const currentUserId = currentUser?.userId || null;


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
      const storedUserDetailsRaw = localStorage.getItem(CURRENT_USER_DETAILS_KEY);
      
      if (token && storedUserDetailsRaw) {
        const storedUser: User = JSON.parse(storedUserDetailsRaw);
        setIsAuthenticated(true);
        setCurrentUser(storedUser);
        checkPasswordChangeStatus(storedUser.userId);
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
  }, [checkPasswordChangeStatus]);

  const login = useCallback(async (userIdInput?: string, password?: string): Promise<boolean> => {
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
              usersToSearch = []; 
            }
          }
          
          const adminExistsInStorage = usersToSearch.some(u => u.userId === MOCK_DEFAULT_ADMIN_USER.userId);
          if (!adminExistsInStorage) {
            usersToSearch.push(MOCK_DEFAULT_ADMIN_USER);
            // Optionally save the updated list back to localStorage if it was missing the default admin
            // localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersToSearch));
          }
          
          const user = usersToSearch.find(u => u.userId === userIdInput);

          if (user && password === MOCK_DEFAULT_PASSWORD) {
            localStorage.setItem(AUTH_TOKEN_KEY, `mock-jwt-token-for-${user.userId}`);
            localStorage.setItem(CURRENT_USER_DETAILS_KEY, JSON.stringify(user)); // Store full user object

            // Keep these for potential direct use or quicker checks if needed, though currentUser is primary
            localStorage.setItem(CURRENT_USER_ROLE_KEY, user.role);
            localStorage.setItem(CURRENT_USER_ID_KEY, user.userId);


            setIsAuthenticated(true);
            setCurrentUser(user);

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
  }, [toast]); 

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_ROLE_KEY);
      localStorage.removeItem(CURRENT_USER_ID_KEY);
      localStorage.removeItem(CURRENT_USER_DETAILS_KEY); // Clear full user details


      setIsAuthenticated(false);
      setCurrentUser(null);
      setIsPasswordChangeRequired(false); 
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/auth/login');
    } catch (e) {
      toast({ title: "Logout Error", description: "Could not clear session.", variant: "destructive" });
    }
  }, [router, toast]);

  const clearPasswordChangeRequirement = useCallback(() => {
    const uid = currentUser?.userId; // Use userId from currentUser
    if (uid) {
      try {
        localStorage.setItem(PASSWORD_CHANGE_REQUIRED_KEY_PREFIX + uid + "_dismissed", 'true');
        localStorage.removeItem(PASSWORD_CHANGE_REQUIRED_KEY_PREFIX + uid);
        setIsPasswordChangeRequired(false);
      } catch (e) {
        console.error("Error clearing password change requirement flag:", e);
      }
    }
  }, [currentUser]);

  const updateCurrentUserDetails = useCallback((updatedDetails: Partial<User>) => {
    if (!currentUser) return;

    const updatedUser: User = { ...currentUser, ...updatedDetails, updatedAt: new Date().toISOString() };
    
    // Update state
    setCurrentUser(updatedUser);
    
    // Update localStorage for the CURRENT_USER_DETAILS_KEY
    localStorage.setItem(CURRENT_USER_DETAILS_KEY, JSON.stringify(updatedUser));

    // Also update this user in the general USERS_STORAGE_KEY list
    try {
      const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      let users: User[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      const userIndex = users.findIndex(u => u.id === updatedUser.id);
      if (userIndex > -1) {
        users[userIndex] = updatedUser;
      } else {
        // This case should ideally not happen if the user was loaded correctly
        users.push(updatedUser); 
      }
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      
      // Optionally, dispatch a storage event if other tabs need to react
      window.dispatchEvent(new StorageEvent('storage', { key: USERS_STORAGE_KEY, newValue: JSON.stringify(users) }));
      window.dispatchEvent(new StorageEvent('storage', { key: CURRENT_USER_DETAILS_KEY, newValue: JSON.stringify(updatedUser) }));


    } catch (error) {
      console.error("Failed to update user details in USERS_STORAGE_KEY:", error);
      toast({ title: "Storage Error", description: "Could not update user in main list.", variant: "destructive" });
    }

    toast({ title: "Profile Updated", description: "Your profile details have been saved." });
  }, [currentUser, toast]);


  return { 
    isAuthenticated, 
    currentUser,
    currentUserRole, 
    currentUserId, 
    isPasswordChangeRequired, 
    login, 
    logout, 
    clearPasswordChangeRequirement, 
    setIsAuthenticated,
    updateCurrentUserDetails
  };
}
