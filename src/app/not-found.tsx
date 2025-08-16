
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <FileQuestion className="h-20 w-20 text-destructive" />
          </div>
          <CardTitle className="text-4xl font-bold text-destructive">404 - Not Found</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Oops! The page you are looking for does not exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">It might have been moved or deleted. Please check the URL or go back to the dashboard.</p>
          <Button asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
