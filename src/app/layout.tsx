import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a common, clean font. Geist is fine too if preferred.
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Added Toaster

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Changed from Geist to Inter for variety, can be reverted.
});


export const metadata: Metadata = {
  title: 'MealAttend',
  description: 'Efficiently manage meal attendance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
