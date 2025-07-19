"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, Loader2, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to send reset email.');
        }

        toast({
            title: "Reset Request Sent",
            description: data.message,
        });

    } catch (error: any) {
        toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 sm:p-8">
      <div className="flex flex-col md:flex-row w-full max-w-4xl shadow-2xl rounded-xl overflow-hidden">
        {/* Form Left Panel (full width on small, specific width on md and up) */}
        <div className="flex-1 p-6 sm:p-10 bg-card">
          <Card className="border-none shadow-none w-full">
            <CardHeader className="text-center p-0 pb-6">
               <div className="flex justify-center mb-4 md:hidden"> {/* KeyRound icon only on small screens here */}
                <KeyRound className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">Forgot Password?</CardTitle>
              <CardDescription className="text-muted-foreground">
                No worries! Enter your email address below. Your administrator will be notified to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-5 w-5" />
                  )}
                  Send Reset Request
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center pt-6 p-0">
              <Link href="/auth/login" legacyBehavior>
                <Button variant="link" className="text-sm">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
        
        {/* Decorative Right Panel (visible on md and up) */}
        <div className="hidden md:flex md:w-2/5 bg-accent/80 text-accent-foreground flex-col items-center justify-center p-8 sm:p-12 space-y-6 text-center">
          <KeyRound className="h-20 w-20 lg:h-24 lg:w-24 text-accent-foreground" />
          <h1 className="text-3xl lg:text-4xl font-bold">Password Recovery</h1>
          <p className="text-md lg:text-lg text-accent-foreground/90 leading-relaxed">
            Regain access to your MealAttend account quickly and securely.
          </p>
           <div className="mt-6 border-t border-accent-foreground/30 pt-6 w-full max-w-xs">
              <p className="text-sm text-accent-foreground/80">
                  MealAttend Security
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}
