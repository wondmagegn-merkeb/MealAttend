
"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Lock, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';

// This is the component that will use useSearchParams
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    } else {
      // Optional: Redirect if email is not in query, or show an error
      toast({ title: "Missing Email", description: "No email provided for password reset.", variant: "destructive"});
      router.push('/auth/forgot-password');
    }
  }, [searchParams, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!resetCode || !newPassword || !confirmPassword) {
      toast({ title: "Missing Fields", description: "Please fill in all fields.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "New passwords do not match.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Simulate API call to verify reset code and update password
    // For demo, let's assume any 6-digit code is valid
    const MOCK_RESET_CODE_VALID = /^\d{6}$/.test(resetCode);

    setTimeout(() => {
      if (MOCK_RESET_CODE_VALID) { // Replace with actual code validation
        toast({
          title: "Password Reset Successful (Simulated)",
          description: "Your password has been updated. You can now log in with your new password.",
        });
        router.push('/auth/login');
      } else {
        toast({
          title: "Invalid Reset Code",
          description: "The reset code entered is incorrect or has expired.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Lock className="h-16 w-16 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">Reset Your Password</CardTitle>
        <CardDescription>
          Enter the reset code sent to {email ? <strong>{email}</strong> : "your email"}, then set a new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="resetCode">Reset Code</Label>
            <Input
              id="resetCode"
              type="text"
              placeholder="Enter 6-digit code"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              required
              disabled={isLoading}
              maxLength={6}
            />
          </div>
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
          <Button type="submit" className="w-full" disabled={isLoading}>
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

    
