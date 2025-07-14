
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Cog, Users, Sparkles, QrCode, ClipboardList, UserCog, FileDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const teamMembers = [
  {
    name: 'Alice Johnson',
    role: 'Project Lead',
    avatarUrl: 'https://placehold.co/100x100.png',
    bio: 'Visionary leader with a passion for creating efficient solutions.',
  },
  {
    name: 'Bob Williams',
    role: 'Lead Developer',
    avatarUrl: 'https://placehold.co/100x100.png',
    bio: 'Expert architect of the MealAttend system and its features.',
  },
  {
    name: 'Charlie Brown',
    role: 'UI/UX Designer',
    avatarUrl: 'https://placehold.co/100x100.png',
    bio: 'Creative mind behind the intuitive and clean user interface.',
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


export default function InfoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/10 p-4 sm:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <Card className="w-full shadow-xl">
          <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                  <Shield className="h-20 w-20 text-accent" />
              </div>
              <CardTitle className="text-4xl font-bold text-primary">MealAttend Information Center</CardTitle>
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

            <Separator />
            
            {/* Our Team Section */}
            <section className="text-left">
                <div className="flex items-center gap-4 mb-4">
                    <Users className="h-10 w-10 text-primary" />
                    <h2 className="text-3xl font-semibold text-primary">Our Team</h2>
                </div>
                 <p className="text-muted-foreground leading-relaxed mb-6">
                  MealAttend is proudly developed by <span className="font-semibold text-accent inline-flex items-center">AddisSpark <Sparkles className="ml-1 h-4 w-4" /></span>, an innovative startup dedicated to creating modern software solutions that solve real-world challenges. Our team is a blend of creative designers, skilled developers, and strategic thinkers.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {teamMembers.map((member) => (
                    <div key={member.name} className="flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                            <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint="team member" />
                            <AvatarFallback>{member.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-lg font-bold">{member.name}</h3>
                        <p className="text-sm text-accent font-semibold">{member.role}</p>
                        <p className="text-sm text-muted-foreground mt-2">{member.bio}</p>
                    </div>
                ))}
                </div>
            </section>

             <Separator />

            {/* Go Back Button */}
            <div className="text-center pt-4">
                <Button asChild>
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back Home
                    </Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
