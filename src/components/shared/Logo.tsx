
"use client";

import { Salad } from 'lucide-react';
import Link from 'next/link';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useAppSettings } from '@/hooks/useAppSettings';

interface LogoProps extends HTMLAttributes<HTMLAnchorElement> {
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  iconColorClass?: string;
  textColorClass?: string;
  siteName?: string;
}

async function getSiteName(): Promise<string> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { siteName: true }
    });
    return settings?.siteName || 'MealAttend';
  } catch (error) {
    console.error("Could not fetch site name for logo", error);
    return 'MealAttend';
  }
}

export function Logo({ size = 'md', iconOnly = false, className, iconColorClass = 'text-accent', textColorClass = 'text-inherit', ...props }: LogoProps) {
  const { settings } = useAppSettings();
  const textSizeClass = size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl';
  const iconSize = size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-6 w-6' : 'h-7 w-7';
  const siteName = await getSiteName();

  return (
    <Link 
      href="/admin" 
      className={cn("flex items-center gap-2 transition-opacity hover:opacity-80", className)}
      {...props}
    >
      <Salad className={cn(iconSize, iconColorClass)} />
      {!iconOnly && (
        <span className={cn("font-bold", textSizeClass, textColorClass)}>
          {settings.siteName}
        </span>
      )}
    </Link>
  );
}
