
"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Lock, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';

// This is the component that will use useSearchParams
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const tokenFromQuery = searchParams.get('token');
    if (tokenFromQuery) {
      setToken(tokenFromQuery);
    } else {
      toast({ title: "Missing Token", description: "No password reset token provided.", variant: "destructive"});
      router.push('/auth/forgot-password');
    }
  }, [searchParams, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!newPassword || !confirmPassword) {
      toast({ title: "Missing Fields", description: "Please fill in all password fields.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    if (newPassword.length < 6) {
      toast({ title: "Password Too Short", description: "Password must be at least 6 characters long.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "New passwords do not match.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      toast({
        title: "Password Reset Successful",
        description: data.message,
      });
      router.push('/auth/login');
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
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Lock className="h-16 w-16 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">Reset Your Password</CardTitle>
        <CardDescription>
          Create a new, strong password for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !token}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Reset Password
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
  );
}


// Wrap ResetPasswordForm with Suspense for useSearchParams
export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
