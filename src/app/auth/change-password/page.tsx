
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logUserActivity } from '@/lib/activityLogger';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUserId, changePassword, isAuthenticated, isPasswordChangeRequired } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated === false || (isAuthenticated === true && !isPasswordChangeRequired)) {
      router.replace('/admin');
    }
  }, [isAuthenticated, isPasswordChangeRequired, router]);


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
    
    const success = await changePassword(newPassword);

    if (success) {
        logUserActivity(currentUserId, "PASSWORD_CHANGE_SUCCESS");
        toast({
          title: "Password Changed",
          description: "Your password has been successfully updated. You can now access the system.",
        });
        router.push('/admin');
    }
    // Errors are handled within the changePassword function, so no need for an else block here.
    setIsLoading(false);
  };
  
  if (isAuthenticated === null) {
     return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (isAuthenticated === false || (isAuthenticated === true && !isPasswordChangeRequired)) {
    return <div className="flex justify-center items-center h-screen"><p>Redirecting...</p></div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <KeyRound className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Change Your Password</CardTitle>
          <CardDescription>
            For security reasons, you need to change your password before proceeding.
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Set New Password
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-xs text-center text-muted-foreground">
            Choose a strong, unique password.
        </CardFooter>
      </Card>
    </div>
  );
}
