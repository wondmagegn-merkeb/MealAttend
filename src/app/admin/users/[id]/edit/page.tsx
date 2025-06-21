
"use client";

import { useRouter, useParams } from 'next/navigation';
import { UserForm, type UserFormData } from "@/components/admin/users/UserForm";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@prisma/client';

async function fetchUserById(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('User not found');
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

type ApiUserUpdateData = {
  fullName: string;
  email: string;
  role: 'Admin' | 'User';
  departmentId: string | null;
  profileImageURL?: string | null;
};

async function updateUserAPI({ id, data }: { id: string, data: ApiUserUpdateData }): Promise<User> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update user' }));
    throw new Error(errorData.message || 'Failed to update user');
  }
  return response.json();
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { currentUserId: actorUserId } = useAuth();
  const queryClient = useQueryClient();
  
  const userIdParam = typeof params.id === 'string' ? params.id : undefined;

  const { data: user, isLoading: isFetchingUser, error: fetchError } = useQuery<User>({
    queryKey: ['user', userIdParam],
    queryFn: () => fetchUserById(userIdParam!),
    enabled: !!userIdParam,
  });

  const mutation = useMutation({
    mutationFn: updateUserAPI,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', updatedUser.id] });
      logUserActivity(actorUserId, "USER_UPDATE_SUCCESS", `Updated user ID: ${updatedUser.userId}, Name: ${updatedUser.fullName}`);
      toast({
        title: "User Updated",
        description: `${updatedUser.fullName}'s record has been updated.`,
      });
      router.push('/admin/users');
    },
    onError: (error: Error) => {
      logUserActivity(actorUserId, "USER_UPDATE_FAILURE", `Attempted to update user ID: ${user?.userId}. Error: ${error.message}`);
      toast({
        title: "Error Updating User",
        description: error.message || "Failed to update user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (data: UserFormData) => {
    if (!userIdParam) return;

    const apiData: ApiUserUpdateData = {
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      departmentId: data.departmentId || null,
      profileImageURL: data.profileImageURL || null,
    };
    mutation.mutate({ id: userIdParam, data: apiData });
  };

  if (isFetchingUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading user data...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto text-center">
         <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-2xl text-destructive flex items-center justify-center"><AlertTriangle className="mr-2 h-7 w-7" /> Error</CardTitle></CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">{fetchError.message === 'User not found' ? 'The user record you are trying to edit could not be found.' : `Failed to load user data: ${fetchError.message}`}</p>
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
