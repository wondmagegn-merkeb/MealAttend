
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogIn, Shield, Cog, Users, Sparkles, QrCode, ClipboardList, UserCog, FileDown, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TeamMember, HomepageFeature } from '@prisma/client';

type IconName = keyof typeof LucideIcons;

const fetchHomepageData = async (): Promise<{ team: TeamMember[], features: HomepageFeature[] }> => {
  const [teamRes, featuresRes] = await Promise.all([
    fetch("/api/team"),
    fetch("/api/features")
  ]);

  if (!teamRes.ok || !featuresRes.ok) {
    throw new Error("Failed to fetch homepage data");
  }

  return {
    team: await teamRes.json(),
    features: await featuresRes.json(),
  };
};

const DynamicIcon = ({ name }: { name: string }) => {
  const IconComponent = LucideIcons[name as IconName] as React.ElementType;
  if (!IconComponent) return <Sparkles className="h-6 w-6 text-accent" />; // Fallback icon
  return <IconComponent className="h-6 w-6 text-accent" />;
};


export default function HomePage() {
  const { settings, isLoading: isLoadingSettings } = useAppSettings();
  const router = useRouter();

  const { data: homepageData, isLoading: isLoadingData } = useQuery<{ team: TeamMember[], features: HomepageFeature[] }>({
    queryKey: ['homepageData'],
    queryFn: fetchHomepageData,
    enabled: !isLoadingSettings && settings.showHomepage, 
  });

  useEffect(() => {
    if (!isLoadingSettings && !settings.showHomepage) {
      router.replace('/auth/login');
    }
  }, [settings, isLoadingSettings, router]);

  const visibleTeamMembers = homepageData?.team?.filter(member => member.isVisible) || [];
  const ceo = visibleTeamMembers.find(member => member.isCeo);
  const otherMembers = visibleTeamMembers.filter(member => !member.isCeo);
  
  const visibleFeatures = homepageData?.features?.filter(feature => feature.isVisible) || [];

  const isLoading = isLoadingSettings || (!homepageData && settings.showHomepage);

  if (isLoading || !settings.showHomepage) {
     return (
      <div className="flex justify-center items-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/10 p-4 sm:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <Card className="w-full shadow-xl">
          <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                  <Shield className="h-20 w-20 text-accent" />
              </div>
              <CardTitle className="text-4xl font-bold text-primary">{settings.siteName} Information Center</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                  {settings.homepageSubtitle}
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-12 px-4 sm:px-6 md:px-10">

            {/* About the System Section */}
            {settings.showFeaturesSection && visibleFeatures.length > 0 && (
                <section className="text-left">
                  <div className="flex items-center gap-4 mb-6">
                     <Cog className="h-10 w-10 text-primary" />
                     <h2 className="text-3xl font-semibold text-primary">System Features</h2>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {visibleFeatures.map((feature) => (
                        <div key={feature.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                            <div className="flex-shrink-0"><DynamicIcon name={feature.icon} /></div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                  </div>
                </section>
            )}

            {settings.showTeamSection && visibleTeamMembers.length > 0 && (
                <>
                    <Separator />
                    
                    {/* Our Team Section */}
                    <section className="text-left">
                        <div className="flex items-center gap-4 mb-4">
                            <Users className="h-10 w-10 text-primary" />
                            <h2 className="text-3xl font-semibold text-primary">Our Team</h2>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 mb-6">
                            <Image 
                                src={settings.companyLogoUrl || "/addisspark-logo.jpg"} 
                                alt="Company Logo" 
                                width={120} 
                                height={120} 
                                className="rounded-lg shadow-md object-contain"
                                data-ai-hint="company logo"
                            />
                            <p className="text-muted-foreground leading-relaxed flex-1">
                                MealAttend is proudly developed by <span className="font-bold text-primary inline-flex items-center gap-1"><Sparkles className="h-4 w-4" />AddisSpark<Sparkles className="h-4 w-4" /></span>, an innovative team dedicated to creating modern software solutions that solve real-world challenges. Our team is a blend of creative designers, skilled developers, and strategic thinkers.
                            </p>
                        </div>
                        
                        <div className="space-y-10">
                        {/* CEO Section */}
                        {ceo && (
                            <div className="flex flex-col items-center text-center mb-10">
                            <Avatar className="h-28 w-28 mb-4 border-4 border-primary">
                                <AvatarImage src={ceo.avatarUrl || `https://placehold.co/112x112.png`} alt={ceo.name} data-ai-hint="man professional" />
                                <AvatarFallback>{ceo.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <h3 className="text-xl font-bold">{ceo.name}</h3>
                            <p className="text-md text-accent font-semibold">{ceo.role}</p>
                            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{ceo.bio}</p>
                            </div>
                        )}

                        {/* Other Team Members */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pt-8">
                            {otherMembers.map((member) => (
                            <div key={member.id} className="flex flex-col items-center text-center">
                                <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                                <AvatarImage src={member.avatarUrl || `https://placehold.co/96x96.png`} alt={member.name} data-ai-hint="professional" />
                                <AvatarFallback>{member.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <h3 className="text-lg font-bold">{member.name}</h3>
                                <p className="text-sm text-accent font-semibold">{member.role}</p>
                                <p className="text-sm text-muted-foreground mt-2">{member.bio}</p>
                            </div>
                            ))}
                        </div>
                        </div>
                    </section>
                </>
            )}


             <Separator />

            {/* Go Back Button */}
            <div className="text-center pt-4">
                <Button asChild size="lg">
                    <Link href="/auth/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login to System
                    </Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
