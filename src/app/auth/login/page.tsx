"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/hooks/useAuth';
import { Loader2, LogIn, Salad, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { REMEMBERED_EMAIL_KEY } from '@/lib/constants';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []); // Run only on component mount

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!email || !password) {
      toast({
        title: "Missing Fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    const success = await login(email, password);
    
    if (success) {
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
      // The router push is handled inside the login function now
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 sm:p-8">
      <div className="flex flex-col md:flex-row w-full max-w-4xl shadow-2xl rounded-xl overflow-hidden bg-card">
        {/* Decorative Left Panel */}
        <div className="hidden md:flex md:w-2/5 bg-primary text-primary-foreground flex-col items-start justify-center p-8 sm:p-12 space-y-6">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">WELCOME</h1>
          <h2 className="text-xl lg:text-2xl font-semibold">MealAttend System</h2>
          <p className="text-sm text-primary-foreground/80 leading-relaxed">
            Efficiently manage and track meal attendance with ease. Sign in to access your dashboard and tools.
          </p>
        </div>

        {/* Login Form Right Panel */}
        <div className="flex-1 p-6 sm:p-10 bg-card">
          <Card className="border-none shadow-none w-full">
            <CardHeader className="text-left p-0 pb-6">
              <div className="flex justify-center mb-4 md:hidden">
                <Salad className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">Sign in</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your credentials to access your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="rememberMe" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="rememberMe" className="font-normal text-muted-foreground">Remember me</Label>
                  </div>
                  <Link href="/auth/forgot-password" legacyBehavior>
                    <a className="text-primary hover:underline hover:text-primary/80">
                      Forgot Password?
                    </a>
                  </Link>
                </div>
                <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-5 w-5" />
                  )}
                  Sign In
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center pt-6 p-0">
                <Link href="/" legacyBehavior>
                  <Button variant="link" className="text-sm text-muted-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                  </Button>
                </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
