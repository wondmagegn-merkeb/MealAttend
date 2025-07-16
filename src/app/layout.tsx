
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import QueryProvider from '@/components/shared/QueryProvider';
import prisma from '@/lib/prisma';
import type { SiteSettings } from '@prisma/client';
import { themes } from '@/lib/themes';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// This function now fetches settings directly for server-side rendering
async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
    });
    // Return settings or a default object if none are found
    return settings || {
      id: 1,
      siteName: 'MealAttend',
      headerContent: 'MealAttend Information Center',
      idPrefix: 'ADERA',
      theme: 'default',
      showFeaturesSection: true,
      showTeamSection: true,
      addisSparkLogoUrl: '',
      leoMaxwellPhotoUrl: '',
      owenGrantPhotoUrl: '',
      eleanorVancePhotoUrl: '',
      sofiaReyesPhotoUrl: '',
      calebFinnPhotoUrl: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Failed to fetch site settings for layout:", error);
    // Return default settings on error to prevent the app from crashing
    return {
      id: 1,
      siteName: 'MealAttend',
      headerContent: 'MealAttend Information Center',
      idPrefix: 'ADERA',
      theme: 'default',
      showFeaturesSection: true,
      showTeamSection: true,
      addisSparkLogoUrl: '',
      leoMaxwellPhotoUrl: '',
      owenGrantPhotoUrl: '',
      eleanorVancePhotoUrl: '',
      sofiaReyesPhotoUrl: '',
      calebFinnPhotoUrl: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// Generate metadata dynamically
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.siteName,
    description: 'Efficiently manage meal attendance.',
  };
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const selectedTheme = themes.find(t => t.name === settings.theme) || themes[0];
  const themeVariables = {
    '--background': selectedTheme.background,
    '--foreground': selectedTheme.foreground,
    '--primary': selectedTheme.primary,
    '--primary-foreground': selectedTheme.primaryForeground,
    '--accent': selectedTheme.accent,
    '--accent-foreground': selectedTheme.accentForeground,
  } as React.CSSProperties;

  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.variable} font-sans antialiased`}
        style={themeVariables}
      >
        <QueryProvider>
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
