
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { UserForm, type UserFormData } from "@/components/admin/users/UserForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { mockUsers } from '@/lib/demo-data';
import type { UserWithDepartment } from '@/types';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { currentUserId: actorUserId } = useAuth();
  
  const userIdParam = typeof params.id === 'string' ? params.id : undefined;

  const [user, setUser] = useState<UserWithDepartment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    if (userIdParam) {
      setTimeout(() => {
        const foundUser = mockUsers.find(u => u.id === userIdParam);
        if (foundUser) {
          setUser(foundUser);
        } else {
          setError(new Error('User not found'));
        }
        setIsLoading(false);
      }, 500);
    } else {
      setError(new Error('No user ID provided'));
      setIsLoading(false);
    }
  }, [userIdParam]);

  const handleFormSubmit = (data: UserFormData) => {
    if (!userIdParam) return;
    setIsSubmitting(true);

    setTimeout(() => {
      logUserActivity(actorUserId, "USER_UPDATE_SUCCESS", `Updated user ID: ${user?.userId}, Name: ${data.fullName}`);
      toast({
        title: "User Updated (Demo)",
        description: `${data.fullName}'s record has been updated.`,
      });
      router.push('/admin/users');
      setIsSubmitting(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto text-center">
         <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-2xl text-destructive flex items-center justify-center"><AlertTriangle className="mr-2 h-7 w-7" /> Error</CardTitle></CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">{error.message === 'User not found' ? 'The user record you are trying to edit could not be found.' : `Failed to load user data: ${error.message}`}</p>
                <Button variant="outline" asChild><Link href="/admin/users"><ArrowLeft className="mr-2 h-4 w-4" />Back to User List</Link></Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-primary">Edit User</h2>
          <p className="text-muted-foreground">Update the details for {user?.fullName}.</p>
        </div>
         <Button variant="outline" asChild><Link href="/admin/users"><ArrowLeft className="mr-2 h-4 w-4" />Back to List</Link></Button>
      </div>
      {user && (
        <UserForm 
          onSubmit={handleFormSubmit} 
          initialData={user} 
          isLoading={isSubmitting}
          submitButtonText="Save Changes"
        />
      )}
    </div>
  );
}
