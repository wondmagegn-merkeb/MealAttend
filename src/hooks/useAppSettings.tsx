
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AppSettings } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';

type AppSettingsContextType = {
  settings: AppSettings;
  isLoading: boolean;
  setSettings: (settings: AppSettings) => void;
};

const defaultSettings: AppSettings = {
  id: 1,
  siteName: "MealAttend",
  idPrefix: "ADERA",
  schoolName: "Tech University",
  colorTheme: "default",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const AppSettingsContext = createContext<AppSettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  setSettings: () => {},
});

export const useAppSettings = () => useContext(AppSettingsContext);

const fetchSettings = async (): Promise<AppSettings> => {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
};

export const AppSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  
  const { data: fetchedSettings, isLoading } = useQuery<AppSettings>({
    queryKey: ['appSettings'],
    queryFn: fetchSettings,
    staleTime: Infinity, // Settings don't change often, fetch once
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (fetchedSettings) {
      setSettings(fetchedSettings);
      document.documentElement.setAttribute('data-theme', fetchedSettings.colorTheme);
    }
  }, [fetchedSettings]);

  const handleSetSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    document.documentElement.setAttribute('data-theme', newSettings.colorTheme);
  };

  const value = {
    settings,
    isLoading,
    setSettings: handleSetSettings,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};
