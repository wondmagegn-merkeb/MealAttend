
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import QueryProvider from '@/components/shared/QueryProvider';
import { AuthProvider } from '@/hooks/useAuth';
import prisma from '@/lib/prisma';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// Generate metadata dynamically
export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    return {
      title: settings?.siteName || 'MealAttend',
      description: 'Efficiently manage meal attendance.',
    };
  } catch (error) {
     return {
      title: 'MealAttend',
      description: 'Efficiently manage meal attendance.',
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
