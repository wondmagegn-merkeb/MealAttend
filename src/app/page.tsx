
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogIn, Shield, Cog, Users, Sparkles, QrCode, ClipboardList, UserCog, FileDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';


const team = [
  {
    name: 'Leo Maxwell',
    role: 'CEO & Full-Stack Developer',
    avatarUrl: '/leo.png',
    bio: 'Wachemo University Computer Science graduate, leading the vision and technology.',
    avatarHint: 'man professional',
    isCeo: true,
  },
  {
    name: 'Owen Grant',
    role: 'CTO & Full-Stack Developer',
    avatarUrl: '/owen.png',
    bio: 'Wachemo University Computer Science graduate, building robust back-end systems.',
    avatarHint: 'man professional',
  },
   {
    name: 'Eleanor Vance',
    role: 'Project Manager & Marketing Lead',
    avatarUrl: '/eleanor.png',
    bio: 'Marketing graduate from Wachemo University, driving our brand and project timelines forward.',
    avatarHint: 'woman professional',
  },
  {
    name: 'Sofia Reyes',
    role: 'Marketing Specialist',
    avatarUrl: '/sofia.png',
    bio: 'Wachemo University marketing graduate with a passion for digital outreach.',
    avatarHint: 'woman professional',
  },
  {
    name: 'Caleb Finn',
    role: 'Lead Full-Stack Developer',
    avatarUrl: '/caleb.png',
    bio: 'Software Engineering graduate from Wachemo University, focusing on seamless user experiences.',
    avatarHint: 'man professional',
  },
];

const features = [
    {
        icon: <QrCode className="h-6 w-6 text-accent" />,
        title: "QR Code Scanning",
        description: "Fast and touchless attendance tracking using individual QR codes."
    },
    {
        icon: <UserCog className="h-6 w-6 text-accent" />,
        title: "Student & User Management",
        description: "Easily add, edit, and manage student and system user profiles."
    },
    {
        icon: <ClipboardList className="h-6 w-6 text-accent" />,
        title: "Comprehensive Dashboard",
        description: "Get a real-time overview of attendance statistics and system activity."
    },
    {
        icon: <FileDown className="h-6 w-6 text-accent" />,
        title: "Reporting & Exports",
        description: "Generate and export detailed attendance reports in PDF and Excel formats."
    }
];


export default function HomePage() {
  const { settings, isLoading } = useAppSettings();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !settings.showHomepage) {
      router.replace('/auth/login');
    }
  }, [settings, isLoading, router]);

  const ceo = team.find(member => member.isCeo);
  const otherMembers = team.filter(member => !member.isCeo);

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
                  Learn more about our system and the team behind it.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-12 px-4 sm:px-6 md:px-10">

            {/* About the System Section */}
            <section className="text-left">
              <div className="flex items-center gap-4 mb-6">
                 <Cog className="h-10 w-10 text-primary" />
                 <h2 className="text-3xl font-semibold text-primary">System Features</h2>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature) => (
                    <div key={feature.title} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="flex-shrink-0">{feature.icon}</div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    </div>
                ))}
              </div>
            </section>

            {settings.showTeamSection && (
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
                            {settings.siteName} is proudly developed by an innovative team dedicated to creating modern software solutions that solve real-world challenges. Our team is a blend of creative designers, skilled developers, and strategic thinkers.
                            </p>
                        </div>
                        
                        <div className="space-y-10">
                        {/* CEO Section */}
                        {ceo && (
                            <div className="flex flex-col items-center text-center mb-10">
                            <Avatar className="h-28 w-28 mb-4 border-4 border-primary">
                                <AvatarImage src={ceo.avatarUrl} alt={ceo.name} data-ai-hint={ceo.avatarHint} />
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
                            <div key={member.name} className="flex flex-col items-center text-center">
                                <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                                <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.avatarHint} />
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
