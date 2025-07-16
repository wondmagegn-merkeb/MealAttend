
import Link from 'next/link';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import prisma from '@/lib/prisma';
import Image from 'next/image';

interface LogoProps extends HTMLAttributes<HTMLAnchorElement> {
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  textColorClass?: string;
  siteName?: string;
}

async function getSiteSettings(): Promise<{ siteName: string; logoUrl: string | null }> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { siteName: true, addisSparkLogoUrl: true }
    });
    return {
      siteName: settings?.siteName || 'MealAttend',
      logoUrl: settings?.addisSparkLogoUrl || null,
    };
  } catch (error) {
    console.error("Could not fetch site settings for logo", error);
    return {
      siteName: 'MealAttend',
      logoUrl: null,
    };
  }
}

export async function Logo({ size = 'md', iconOnly = false, className, textColorClass = 'text-inherit', ...props }: LogoProps) {
  const textSizeClass = size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl';
  const iconSize = size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-9 w-9' : 'h-10 w-10'; // Adjusted for images
  const { siteName, logoUrl } = await getSiteSettings();

  return (
    <Link 
      href="/admin" 
      className={cn("flex items-center gap-2 transition-opacity hover:opacity-80", className)}
      {...props}
    >
      <div className={cn("relative", iconSize)}>
        <Image 
            src={logoUrl || "/addisspark-logo.jpg"}
            alt={`${siteName} Logo`}
            fill
            className="rounded-md object-contain"
            data-ai-hint="spark logo"
        />
      </div>
      {!iconOnly && (
        <span className={cn("font-bold", textSizeClass, textColorClass)}>
          {siteName}
        </span>
      )}
    </Link>
  );
}
