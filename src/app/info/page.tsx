import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function InfoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/10 p-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Shield className="h-20 w-20 text-accent" />
            </div>
            <CardTitle className="text-4xl font-bold text-primary">A Public Information Page</CardTitle>
            <CardDescription className="text-lg">
                This page is accessible to everyone, without any authentication required.
            </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground leading-relaxed">
                You can use pages like this for marketing content, FAQs, contact information, or any other details you want to share with the public. Since it is not wrapped by the `AuthGuard` component, Next.js serves it to any visitor.
            </p>
            <Button asChild>
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back Home
                </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
