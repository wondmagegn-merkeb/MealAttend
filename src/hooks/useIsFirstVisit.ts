"use client";

import { useState, useEffect, useCallback } from 'react';

export function useIsFirstVisit(storageKey: string): [boolean, () => void, boolean] {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // localStorage can only be accessed on the client
    try {
      const item = localStorage.getItem(storageKey);
      if (!item) {
        setIsFirstVisit(true);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${storageKey}":`, error);
      // Fallback or decide behavior if localStorage is unavailable
    }
  }, [storageKey]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'true');
      setIsFirstVisit(false);
    } catch (error) {
      console.warn(`Error setting localStorage key "${storageKey}":`, error);
    }
  }, [storageKey]);

  return [isFirstVisit && isMounted, dismiss, isMounted];
}
