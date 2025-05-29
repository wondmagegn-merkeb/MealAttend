
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/useAuth';
import { Loader2, LogIn, Salad } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!userId || !password) {
      toast({
        title: "Missing Fields",
        description: "Please enter both User ID and password.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    const success = await login(userId, password);
    setIsLoading(false);
    if (success) {
      router.push('/admin'); 
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-stretch justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Decorative Left Panel (visible on md and up) */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/2 bg-primary/80 text-primary-foreground flex-col items-center justify-center p-12 space-y-6 text-center shadow-2xl">
        <Salad className="h-24 w-24 text-primary-foreground" />
        <h1 className="text-4xl lg:text-5xl font-bold">MealAttend System</h1>
        <p className="text-lg lg:text-xl text-primary-foreground/90">
          Efficiently manage and track meal attendance with ease. Welcome back!
        </p>
         <div className="mt-8 border-t border-primary-foreground/30 pt-6 w-full max-w-xs">
            <p className="text-sm text-primary-foreground/80">
                &copy; {new Date().getFullYear()} MealAttend. All rights reserved.
            </p>
        </div>
      </div>

      {/* Login Form Right Panel (full width on small, specific width on md and up) */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md shadow-2xl bg-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 md:hidden"> {/* Salad icon only on small screens here */}
              <Salad className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Welcome Back!</CardTitle>
            <CardDescription>Sign in to access your MealAttend dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="text"
                  placeholder="e.g., ADERA/USR/2024/00001"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-2">
            <Link href="/auth/forgot-password" legacyBehavior>
              <a className="text-sm text-primary hover:underline">
                Forgot your password?
              </a>
            </Link>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Hint: User ID e.g., <code className="bg-muted px-1 py-0.5 rounded-sm">ADERA/USR/2024/00001</code><br/>Password: <code className="bg-muted px-1 py-0.5 rounded-sm">password123</code>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
