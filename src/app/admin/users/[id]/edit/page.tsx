
"use client";

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserForm, type UserFormData } from "@/components/admin/users/UserForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types';

const fetchUser = async (id: string): Promise<User> => {
    const token = localStorage.getItem('mealAttendAuthToken_v1');
    const response = await fetch(`/api/users/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
        if (response.status === 404) throw new Error('User not found');
        throw new Error('Failed to fetch user');
    }
    return response.json();
};

const updateUser = async ({ id, data }: { id: string, data: UserFormData }): Promise<User> => {
    const token = localStorage.getItem('mealAttendAuthToken_v1');
    const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
    }
    return response.json();
};


export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUserId: actorUserId } = useAuth();
  
  const userIdParam = typeof params.id === 'string' ? params.id : undefined;

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user', userIdParam],
    queryFn: () => fetchUser(userIdParam!),
    enabled: !!userIdParam,
  });

  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedData, variables) => {
      toast({
        title: "User Updated",
        description: `${updatedData.fullName}'s record has been updated.`,
      });
      let logDetails = `Updated user ID: ${updatedData.userId}, Name: ${updatedData.fullName}`;
      if (variables.data.password) {
        logDetails += '. Password was reset.';
      }
      logUserActivity(actorUserId, "USER_UPDATE_SUCCESS", logDetails);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userIdParam] });
      router.push('/admin/users');
    },
    onError: (error: Error) => {
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  });


  const handleFormSubmit = (data: UserFormData) => {
    if (!userIdParam) return;
    mutation.mutate({ id: userIdParam, data });
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
                <p className="text-muted-foreground mb-4">{(error as Error).message === 'User not found' ? 'The user record you are trying to edit could not be found.' : `Failed to load user data: ${(error as Error).message}`}</p>
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
          isLoading={mutation.isPending}
          submitButtonText="Save Changes"
        />
      )}
    </div>
  );
}
