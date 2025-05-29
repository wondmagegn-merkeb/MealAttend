
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

    setTimeout(() => {
      toast({
        title: "Reset Code Sent (Simulated)",
        description: `If an account exists for ${email}, a reset code has been sent. Please check your inbox.`,
      });
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col md:flex-row items-stretch justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Forgot Password Form Left Panel (full width on small, specific width on md and up) */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md shadow-2xl bg-card">
          <CardHeader className="text-center">
             <div className="flex justify-center mb-4 md:hidden"> {/* KeyRound icon only on small screens here */}
              <KeyRound className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Forgot Password?</CardTitle>
            <CardDescription>No worries! Enter your email address below and we&apos;ll (simulate) send you a code to reset your password.</CardDescription>
          </CardHeader>
          <CardContent>
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
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Send Reset Code
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/auth/login" legacyBehavior>
              <Button variant="link" className="text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      {/* Decorative Right Panel (visible on md and up) */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/2 bg-accent/80 text-accent-foreground flex-col items-center justify-center p-12 space-y-6 text-center shadow-2xl">
        <KeyRound className="h-24 w-24 text-accent-foreground" />
        <h1 className="text-4xl lg:text-5xl font-bold">Password Recovery</h1>
        <p className="text-lg lg:text-xl text-accent-foreground/90">
          Regain access to your MealAttend account quickly and securely.
        </p>
         <div className="mt-8 border-t border-accent-foreground/30 pt-6 w-full max-w-xs">
            <p className="text-sm text-accent-foreground/80">
                MealAttend Security
            </p>
        </div>
      </div>
    </div>
  );
}
